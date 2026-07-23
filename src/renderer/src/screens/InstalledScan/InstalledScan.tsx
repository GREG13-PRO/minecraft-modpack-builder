import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Check, Plus, RefreshCw } from 'lucide-react'
import type { InstalledModScanResult } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './InstalledScan.css'

function InstalledScan(): React.JSX.Element {
  const { t } = useTranslation()
  const project = useProjectStore((s) => s.project)
  const addItem = useProjectStore((s) => s.addItem)
  const [folder, setFolder] = useState<string | undefined>()
  const [results, setResults] = useState<InstalledModScanResult[] | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!project) return <p>{t('installedScan.noProject')}</p>

  async function handlePickFolder(): Promise<void> {
    const picked = await window.api.scan.pickFolder()
    if (picked) setFolder(picked)
  }

  async function handleScan(): Promise<void> {
    if (!folder) return
    setScanning(true)
    setError(null)
    try {
      const scanResults = await window.api.scan.run(folder, project!.mcVersion.id, project!.loader)
      setResults(scanResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setScanning(false)
    }
  }

  function handleAdd(result: InstalledModScanResult, useLatest: boolean): void {
    if (!result.matchedRef) return
    const version = useLatest ? result.latestCompatibleVersion : result.matchedVersion
    if (!version) return
    addItem('mod', {
      ref: result.matchedRef,
      pinnedVersion: version,
      addedAt: new Date().toISOString(),
      fromLocalScan: true
    })
  }

  const addedIds = new Set(project.mods.map((m) => `${m.ref.source}:${m.ref.projectId}`))
  const summary = results
    ? {
        total: results.length,
        upToDate: results.filter((r) => r.status === 'up-to-date').length,
        outdated: results.filter((r) => r.status === 'outdated').length,
        problem: results.filter((r) => r.status === 'incompatible-loader' || r.status === 'unrecognized').length
      }
    : null

  return (
    <div className="installed-scan">
      <div className="scan-toolbar">
        <button className="btn btn-ghost" onClick={handlePickFolder}>
          <FolderOpen size={15} /> {t('installedScan.pickFolder')}
        </button>
        <span className="scan-folder-path">{folder ?? t('installedScan.noFolder')}</span>
        <button className="btn" onClick={handleScan} disabled={!folder || scanning}>
          {scanning ? t('installedScan.scanning') : t('installedScan.startScan')}
        </button>
      </div>

      {error && <div className="notice danger">{t('installedScan.scanError', { message: error })}</div>}

      {summary && (
        <div className="scan-summary">
          <span className="ss-item">
            <strong>{summary.total}</strong> {t('installedScan.summary.total')}
          </span>
          <span className="ss-item ok">
            <strong>{summary.upToDate}</strong> {t('installedScan.summary.upToDate')}
          </span>
          <span className="ss-item warn">
            <strong>{summary.outdated}</strong> {t('installedScan.summary.outdated')}
          </span>
          <span className="ss-item danger">
            <strong>{summary.problem}</strong> {t('installedScan.summary.problem')}
          </span>
        </div>
      )}

      {results && (
        <div className="scan-results">
          {results.map((r) => {
            const name = r.matchedRef?.name ?? r.detectedIdentity?.name ?? r.detectedIdentity?.modId ?? '?'
            // Windows paths use '\', everywhere else uses '/' — split on both.
            const fileName = r.filePath.split(/[/\\]/).pop()
            const added = r.matchedRef ? addedIds.has(`${r.matchedRef.source}:${r.matchedRef.projectId}`) : false

            return (
              <div className="scan-row" key={r.filePath}>
                <div className="scan-row-info">
                  <span className={`status-dot ${r.status}`} />
                  <div>
                    <div className="scan-row-name">
                      {name}
                      {r.matchedRef && <span className={`badge ${r.matchedRef.source}`}>{r.matchedRef.source}</span>}
                    </div>
                    <div className="scan-row-file">{fileName}</div>
                  </div>
                </div>
                <span className={`status-label ${r.status}`}>{t(`installedScan.status.${r.status}`)}</span>
                {r.status === 'outdated' && r.latestCompatibleVersion && (
                  <button className="btn" disabled={added} onClick={() => handleAdd(r, true)}>
                    {added ? <Check size={14} /> : <RefreshCw size={14} />}
                    {added
                      ? t('installedScan.added')
                      : t('installedScan.update', { version: r.latestCompatibleVersion.displayName })}
                  </button>
                )}
                {r.status === 'up-to-date' && (
                  <button className="btn btn-ghost" disabled={added} onClick={() => handleAdd(r, false)}>
                    {added ? <Check size={14} /> : <Plus size={14} />}
                    {added ? t('installedScan.added') : t('installedScan.addToProject')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default InstalledScan
