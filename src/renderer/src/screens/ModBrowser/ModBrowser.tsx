import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ModRef, ModSource } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './ModBrowser.css'

type SourceFilter = ModSource | 'both'

const SOURCE_LABELS: Record<SourceFilter, string> = {
  both: 'Mindkettő',
  modrinth: 'Modrinth',
  curseforge: 'CurseForge'
}

function ModBrowser(): React.JSX.Element {
  const project = useProjectStore((s) => s.project)
  const addMod = useProjectStore((s) => s.addMod)
  const removeMod = useProjectStore((s) => s.removeMod)
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<SourceFilter>('both')

  const { data: hasCurseForgeKey } = useQuery({
    queryKey: ['hasCurseForgeApiKey'],
    queryFn: () => window.api.settings.hasCurseForgeApiKey()
  })

  const { data, isFetching, error } = useQuery({
    queryKey: ['modSearch', query, project?.mcVersion.id, project?.loader, source],
    queryFn: () =>
      window.api.search.searchMods({
        query,
        mcVersion: project!.mcVersion.id,
        loader: project!.loader,
        source
      }),
    enabled: Boolean(project)
  })

  if (!project) return <p>Előbb hozz létre egy projektet.</p>

  const addedIds = new Set(project.mods.map((m) => `${m.ref.source}:${m.ref.projectId}`))

  async function handleAdd(ref: ModRef): Promise<void> {
    const versions = await window.api.search.listVersions(ref, project!.mcVersion.id, project!.loader)
    if (versions.length === 0) return
    addMod({ ref, pinnedVersion: versions[0], addedAt: new Date().toISOString() })
  }

  return (
    <div className="mod-browser">
      <div className="mb-toolbar">
        <div className="mb-search">
          <span className="mb-search-icon">🔍</span>
          <input
            className="input"
            placeholder="Mod keresése..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="segmented">
          {(['both', 'modrinth', 'curseforge'] as SourceFilter[]).map((s) => (
            <button key={s} className={source === s ? 'seg active' : 'seg'} onClick={() => setSource(s)}>
              {SOURCE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {source !== 'modrinth' && hasCurseForgeKey === false && (
        <div className="notice warn">
          Nincs beállítva CurseForge API kulcs — a CurseForge találatok nem jelennek meg. Add meg a
          Beállításokban.
        </div>
      )}
      {error && <div className="notice danger">Hiba a keresés során: {(error as Error).message}</div>}
      {data?.sourceErrors?.map((se) => (
        <div key={se.source} className="notice warn">
          {se.source === 'curseforge' ? 'CurseForge' : 'Modrinth'}: {se.message}
        </div>
      ))}

      <div className="mb-layout">
        <section className="mb-results">
          {isFetching && <div className="mb-hint">Keresés...</div>}
          {!isFetching && data?.refs.length === 0 && <div className="mb-hint">Nincs találat.</div>}
          {data?.refs.map((ref) => {
            const key = `${ref.source}:${ref.projectId}`
            const added = addedIds.has(key)
            return (
              <article className="mod-card" key={key}>
                <div className="mod-icon">
                  {ref.iconUrl ? <img src={ref.iconUrl} alt="" /> : <span>📦</span>}
                </div>
                <div className="mod-info">
                  <div className="mod-title">
                    <span className="mod-name">{ref.name}</span>
                    <span className={`badge ${ref.source}`}>{ref.source}</span>
                  </div>
                  {ref.summary && <p className="mod-summary">{ref.summary}</p>}
                </div>
                <button
                  className={added ? 'btn btn-ghost' : 'btn'}
                  disabled={added}
                  onClick={() => handleAdd(ref)}
                >
                  {added ? '✓ Hozzáadva' : '+ Hozzáadás'}
                </button>
              </article>
            )
          })}
        </section>

        <aside className="mb-selected">
          <div className="mbs-head">
            Kiválasztott modok <span className="mbs-count">{project.mods.length}</span>
          </div>
          {project.mods.length === 0 && <div className="mbs-empty">Még nincs kiválasztott mod.</div>}
          <div className="mbs-list">
            {project.mods.map((m) => (
              <div className="mbs-item" key={`${m.ref.source}:${m.ref.projectId}`}>
                <div className="mbs-item-info">
                  <span className="mbs-item-name">{m.ref.name}</span>
                  <span className="mbs-item-version">{m.pinnedVersion.displayName}</span>
                </div>
                <button
                  className="mbs-remove"
                  title="Eltávolítás"
                  onClick={() => removeMod(m.ref.projectId, m.ref.source)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default ModBrowser
