import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ContentType, ModRef, ModSource } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './ModBrowser.css'

type SourceFilter = ModSource | 'both'

const SOURCE_LABELS: Record<SourceFilter, string> = {
  both: 'Mindkettő',
  modrinth: 'Modrinth',
  curseforge: 'CurseForge'
}

const CONTENT_TYPES: { id: ContentType; label: string; icon: string; field: 'mods' | 'resourcePacks' | 'shaders' }[] = [
  { id: 'mod', label: 'Modok', icon: '🧩', field: 'mods' },
  { id: 'resourcepack', label: 'Resource packok', icon: '🖼️', field: 'resourcePacks' },
  { id: 'shader', label: 'Shaderek', icon: '✨', field: 'shaders' }
]

const CONTENT_SEARCH_PLACEHOLDER: Record<ContentType, string> = {
  mod: 'Mod keresése...',
  resourcepack: 'Resource pack keresése...',
  shader: 'Shader keresése...'
}

const CONTENT_ADD_LABEL: Record<ContentType, string> = {
  mod: 'Kiválasztott modok',
  resourcepack: 'Kiválasztott resource packok',
  shader: 'Kiválasztott shaderek'
}

function ModBrowser(): React.JSX.Element {
  const project = useProjectStore((s) => s.project)
  const addItem = useProjectStore((s) => s.addItem)
  const removeItem = useProjectStore((s) => s.removeItem)
  const [contentType, setContentType] = useState<ContentType>('mod')
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<SourceFilter>('both')

  const { data: hasCurseForgeKey } = useQuery({
    queryKey: ['hasCurseForgeApiKey'],
    queryFn: () => window.api.settings.hasCurseForgeApiKey()
  })

  const { data, isFetching, error } = useQuery({
    queryKey: ['modSearch', query, project?.mcVersion.id, project?.loader, source, contentType],
    queryFn: () =>
      window.api.search.searchMods({
        query,
        mcVersion: project!.mcVersion.id,
        loader: project!.loader,
        source,
        contentType
      }),
    enabled: Boolean(project)
  })

  if (!project) return <p>Előbb hozz létre egy projektet.</p>

  const activeField = CONTENT_TYPES.find((c) => c.id === contentType)!.field
  const selectedItems = project[activeField]
  const addedIds = new Set(selectedItems.map((m) => `${m.ref.source}:${m.ref.projectId}`))

  async function handleAdd(ref: ModRef): Promise<void> {
    const versions = await window.api.search.listVersions(ref, project!.mcVersion.id, project!.loader, contentType)
    if (versions.length === 0) return
    addItem(contentType, { ref, pinnedVersion: versions[0], addedAt: new Date().toISOString() })
  }

  return (
    <div className="mod-browser">
      <div className="content-type-tabs">
        {CONTENT_TYPES.map((c) => (
          <button
            key={c.id}
            className={contentType === c.id ? 'ct-tab active' : 'ct-tab'}
            onClick={() => setContentType(c.id)}
          >
            <span>{c.icon}</span> {c.label}
            <span className="ct-tab-count">{project[c.field].length}</span>
          </button>
        ))}
      </div>

      <div className="mb-toolbar">
        <div className="mb-search">
          <span className="mb-search-icon">🔍</span>
          <input
            className="input"
            placeholder={CONTENT_SEARCH_PLACEHOLDER[contentType]}
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
            {CONTENT_ADD_LABEL[contentType]} <span className="mbs-count">{selectedItems.length}</span>
          </div>
          {selectedItems.length === 0 && <div className="mbs-empty">Még nincs kiválasztva.</div>}
          <div className="mbs-list">
            {selectedItems.map((m) => (
              <div className="mbs-item" key={`${m.ref.source}:${m.ref.projectId}`}>
                <div className="mbs-item-info">
                  <span className="mbs-item-name">{m.ref.name}</span>
                  <span className="mbs-item-version">{m.pinnedVersion.displayName}</span>
                </div>
                <button
                  className="mbs-remove"
                  title="Eltávolítás"
                  onClick={() => removeItem(contentType, m.ref.projectId, m.ref.source)}
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
