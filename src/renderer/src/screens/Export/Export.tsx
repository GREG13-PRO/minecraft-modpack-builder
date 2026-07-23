import { useState } from 'react'
import type { ExportFormat, ExportResult } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './Export.css'

const FORMAT_OPTIONS: { id: ExportFormat; title: string; description: string; icon: string }[] = [
  {
    id: 'folder',
    title: 'Mods mappa',
    description: 'Letölti a modokat/resource packokat/shadereket egy mods/resourcepacks/shaderpacks mappastruktúrába — TLauncherhez vagy a hivatalos launcherhez.',
    icon: '📁'
  },
  {
    id: 'mrpack',
    title: '.mrpack',
    description: 'Modrinth modpack formátum — importálható Prism Launcherbe és más .mrpack-kompatibilis launcherekbe.',
    icon: '📦'
  },
  {
    id: 'curseforge-zip',
    title: 'CurseForge zip',
    description: 'CurseForge modpack formátum (manifest.json + overrides) — importálható a CurseForge appba.',
    icon: '🗜️'
  }
]

type RunState = { kind: 'idle' } | { kind: 'running' } | { kind: 'done'; result: ExportResult } | { kind: 'error'; message: string }

function Export(): React.JSX.Element {
  const project = useProjectStore((s) => s.project)
  const [format, setFormat] = useState<ExportFormat>('folder')
  const [destination, setDestination] = useState<string | undefined>()
  const [runState, setRunState] = useState<RunState>({ kind: 'idle' })

  if (!project) return <p>Előbb hozz létre egy projektet.</p>

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
      <h2 className="export-title">Export</h2>
      <p className="export-summary">
        {project.mods.length} mod · {project.resourcePacks.length} resource pack · {project.shaders.length} shader
      </p>

      <div className="format-options">
        {FORMAT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={format === opt.id ? 'format-card active' : 'format-card'}
            onClick={() => handleFormatChange(opt.id)}
          >
            <span className="format-icon">{opt.icon}</span>
            <span className="format-title">{opt.title}</span>
            <span className="format-desc">{opt.description}</span>
          </button>
        ))}
      </div>

      <div className="export-actions">
        <button className="btn btn-ghost" onClick={handlePickDestination} disabled={totalItems === 0}>
          {format === 'folder' ? '📁 Cél mappa kiválasztása' : '💾 Fájl helyének kiválasztása'}
        </button>
        <span className="export-destination">{destination ?? 'Nincs cél kiválasztva'}</span>
        <button
          className="btn"
          onClick={handleExport}
          disabled={!destination || totalItems === 0 || runState.kind === 'running'}
        >
          {runState.kind === 'running' ? 'Exportálás...' : 'Export indítása'}
        </button>
      </div>

      {totalItems === 0 && <div className="notice warn">Nincs kiválasztott mod, resource pack vagy shader.</div>}

      {runState.kind === 'error' && <div className="notice danger">Hiba az export során: {runState.message}</div>}

      {runState.kind === 'done' && (
        <div className="export-result">
          <div className="notice ok">✓ Export kész: {runState.result.outputPath}</div>
          {runState.result.warnings.length > 0 && (
            <div className="export-warnings">
              <div className="ew-head">{runState.result.warnings.length} figyelmeztetés:</div>
              {runState.result.warnings.map((w, i) => (
                <div className="ew-item" key={i}>
                  {w.reason}
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
