import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { ContentType, ModRef, ModSource } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './ModBrowser.css'

type SourceFilter = ModSource | 'both'

const CONTENT_TYPES: { id: ContentType; icon: string; field: 'mods' | 'resourcePacks' | 'shaders' }[] = [
  { id: 'mod', icon: '🧩', field: 'mods' },
  { id: 'resourcepack', icon: '🖼️', field: 'resourcePacks' },
  { id: 'shader', icon: '✨', field: 'shaders' }
]

function ModBrowser(): React.JSX.Element {
  const { t } = useTranslation()
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

  if (!project) return <p>{t('modBrowser.noProject')}</p>

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
            <span>{c.icon}</span> {t(`modBrowser.contentType.${c.id}`)}
            <span className="ct-tab-count">{project[c.field].length}</span>
          </button>
        ))}
      </div>

      <div className="mb-toolbar">
        <div className="mb-search">
          <span className="mb-search-icon">🔍</span>
          <input
            className="input"
            placeholder={t(`modBrowser.searchPlaceholder.${contentType}`)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="segmented">
          {(['both', 'modrinth', 'curseforge'] as SourceFilter[]).map((s) => (
            <button key={s} className={source === s ? 'seg active' : 'seg'} onClick={() => setSource(s)}>
              {t(`modBrowser.source.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {source !== 'modrinth' && hasCurseForgeKey === false && (
        <div className="notice warn">{t('modBrowser.noCurseForgeKey')}</div>
      )}
      {error && <div className="notice danger">{t('modBrowser.searchError', { message: (error as Error).message })}</div>}
      {data?.sourceErrors?.map((se) => (
        <div key={se.source} className="notice warn">
          {t(`modBrowser.sourceError.${se.code}`, { source: se.source, status: se.status, detail: se.detail })}
        </div>
      ))}

      <div className="mb-layout">
        <section className="mb-results">
          {isFetching && <div className="mb-hint">{t('modBrowser.searching')}</div>}
          {!isFetching && data?.refs.length === 0 && <div className="mb-hint">{t('modBrowser.noResults')}</div>}
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
                  {added ? t('modBrowser.added') : t('modBrowser.add')}
                </button>
              </article>
            )
          })}
        </section>

        <aside className="mb-selected">
          <div className="mbs-head">
            {t(`modBrowser.selectedLabel.${contentType}`)} <span className="mbs-count">{selectedItems.length}</span>
          </div>
          {selectedItems.length === 0 && <div className="mbs-empty">{t('modBrowser.empty')}</div>}
          <div className="mbs-list">
            {selectedItems.map((m) => (
              <div className="mbs-item" key={`${m.ref.source}:${m.ref.projectId}`}>
                <div className="mbs-item-info">
                  <span className="mbs-item-name">{m.ref.name}</span>
                  <span className="mbs-item-version">{m.pinnedVersion.displayName}</span>
                </div>
                <button
                  className="mbs-remove"
                  title={t('modBrowser.remove')}
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
