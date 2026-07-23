import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder, Package, Archive, FolderOpen, Save, Check, type LucideIcon } from 'lucide-react'
import type { ExportFormat, ExportResult } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './Export.css'

const FORMAT_IDS: ExportFormat[] = ['folder', 'mrpack', 'curseforge-zip']
const FORMAT_ICON: Record<ExportFormat, LucideIcon> = { folder: Folder, mrpack: Package, 'curseforge-zip': Archive }

type RunState = { kind: 'idle' } | { kind: 'running' } | { kind: 'done'; result: ExportResult } | { kind: 'error'; message: string }

function Export(): React.JSX.Element {
  const { t } = useTranslation()
  const project = useProjectStore((s) => s.project)
  const [format, setFormat] = useState<ExportFormat>('folder')
  const [destination, setDestination] = useState<string | undefined>()
  const [runState, setRunState] = useState<RunState>({ kind: 'idle' })

  if (!project) return <p>{t('export.noProject')}</p>

  const totalItems = project.mods.length + project.resourcePacks.length + project.shaders.length

  async function handlePickDestination(): Promise<void> {
    const picked = await window.api.export.pickDestination(format, project!.name)
    if (picked) setDestination(picked)
  }

  async function handleExport(): Promise<void> {
    if (!destination) return
    setRunState({ kind: 'running' })
    try {
      const result = await window.api.export.run(project!, format, destination)
      setRunState({ kind: 'done', result })
    } catch (err) {
      setRunState({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  function handleFormatChange(next: ExportFormat): void {
    setFormat(next)
    setDestination(undefined)
    setRunState({ kind: 'idle' })
  }

  return (
    <div className="export-screen">
      <h2 className="export-title">{t('export.title')}</h2>
      <p className="export-summary">
        {t('export.summary', {
          mods: project.mods.length,
          resourcePacks: project.resourcePacks.length,
          shaders: project.shaders.length
        })}
      </p>

      <div className="format-options">
        {FORMAT_IDS.map((id) => {
          const Icon = FORMAT_ICON[id]
          return (
            <button
              key={id}
              className={format === id ? 'format-card active' : 'format-card'}
              onClick={() => handleFormatChange(id)}
            >
              <span className="format-icon">
                <Icon size={20} />
              </span>
              <span className="format-title">{t(`export.formats.${id}.title`)}</span>
              <span className="format-desc">{t(`export.formats.${id}.description`)}</span>
            </button>
          )
        })}
      </div>

      <div className="export-actions">
        <button className="btn btn-ghost" onClick={handlePickDestination} disabled={totalItems === 0}>
          {format === 'folder' ? <FolderOpen size={15} /> : <Save size={15} />}
          {format === 'folder' ? t('export.pickFolder') : t('export.pickFile')}
        </button>
        <span className="export-destination">{destination ?? t('export.noDestination')}</span>
        <button
          className="btn"
          onClick={handleExport}
          disabled={!destination || totalItems === 0 || runState.kind === 'running'}
        >
          {runState.kind === 'running' ? t('export.exporting') : t('export.startExport')}
        </button>
      </div>

      {totalItems === 0 && <div className="notice warn">{t('export.nothingSelected')}</div>}

      {runState.kind === 'error' && (
        <div className="notice danger">{t('export.exportError', { message: runState.message })}</div>
      )}

      {runState.kind === 'done' && (
        <div className="export-result">
          <div className="notice ok">
            <Check size={14} /> {t('export.exportDone', { path: runState.result.outputPath })}
          </div>
          {runState.result.warnings.length > 0 && (
            <div className="export-warnings">
              <div className="ew-head">{t('export.warningsCount', { count: runState.result.warnings.length })}</div>
              {runState.result.warnings.map((w, i) => (
                <div className="ew-item" key={i}>
                  {t(`export.warningReason.${w.reasonCode}`, { name: w.mod.ref.name, detail: w.detail })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Export
