import { useState } from 'react'
import type { InstalledModScanResult, ScanStatus } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './InstalledScan.css'

const STATUS_LABEL: Record<ScanStatus, string> = {
  'up-to-date': 'Naprakész',
  outdated: 'Elavult',
  'incompatible-loader': 'Nem kompatibilis',
  unrecognized: 'Ismeretlen',
  'not-on-target-mc-version': 'Nem ellenőrizhető'
}

function InstalledScan(): React.JSX.Element {
  const project = useProjectStore((s) => s.project)
  const addMod = useProjectStore((s) => s.addMod)
  const [folder, setFolder] = useState<string | undefined>()
  const [results, setResults] = useState<InstalledModScanResult[] | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!project) return <p>Előbb hozz létre egy projektet.</p>

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
    addMod({ ref: result.matchedRef, pinnedVersion: version, addedAt: new Date().toISOString(), fromLocalScan: true })
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
          📁 Mods mappa kiválasztása
        </button>
        <span className="scan-folder-path">{folder ?? 'Nincs mappa kiválasztva'}</span>
        <button className="btn" onClick={handleScan} disabled={!folder || scanning}>
          {scanning ? 'Beolvasás...' : 'Beolvasás indítása'}
        </button>
      </div>

      {error && <div className="notice danger">Hiba a beolvasás során: {error}</div>}

      {summary && (
        <div className="scan-summary">
          <span className="ss-item">
            <strong>{summary.total}</strong> mod
          </span>
          <span className="ss-item ok">
            <strong>{summary.upToDate}</strong> naprakész
          </span>
          <span className="ss-item warn">
            <strong>{summary.outdated}</strong> elavult
          </span>
          <span className="ss-item danger">
            <strong>{summary.problem}</strong> problémás
          </span>
        </div>
      )}

      {results && (
        <div className="scan-results">
          {results.map((r) => {
            const name = r.matchedRef?.name ?? r.detectedIdentity?.name ?? r.detectedIdentity?.modId ?? '?'
            const fileName = r.filePath.split('/').pop()
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
                <span className={`status-label ${r.status}`}>{STATUS_LABEL[r.status]}</span>
                {r.status === 'outdated' && r.latestCompatibleVersion && (
                  <button className="btn" disabled={added} onClick={() => handleAdd(r, true)}>
                    {added ? '✓ Hozzáadva' : `Frissítés (${r.latestCompatibleVersion.displayName})`}
                  </button>
                )}
                {r.status === 'up-to-date' && (
                  <button className="btn btn-ghost" disabled={added} onClick={() => handleAdd(r, false)}>
                    {added ? '✓ Hozzáadva' : '+ Projekthez adás'}
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
