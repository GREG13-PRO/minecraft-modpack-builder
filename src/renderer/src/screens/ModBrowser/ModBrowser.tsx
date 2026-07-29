import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Puzzle,
  Image,
  Sparkles,
  Search,
  Package,
  Plus,
  Check,
  X,
  type LucideIcon
} from 'lucide-react'
import type { ContentType, ModpackMod, ModRef, ModSource, ModVersionRef } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import ModDetail from '../../components/ModDetail'
import './ModBrowser.css'

type SourceFilter = ModSource | 'both'

const CONTENT_TYPES: {
  id: ContentType
  icon: LucideIcon
  field: 'mods' | 'resourcePacks' | 'shaders'
}[] = [
  { id: 'mod', icon: Puzzle, field: 'mods' },
  { id: 'resourcepack', icon: Image, field: 'resourcePacks' },
  { id: 'shader', icon: Sparkles, field: 'shaders' }
]

function ModBrowser(): React.JSX.Element {
  const { t } = useTranslation()
  const project = useProjectStore((s) => s.project)
  const addItem = useProjectStore((s) => s.addItem)
  const removeItem = useProjectStore((s) => s.removeItem)
  const updateVersion = useProjectStore((s) => s.updateVersion)
  const [contentType, setContentType] = useState<ContentType>('mod')
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<SourceFilter>('both')
  const [detailRef, setDetailRef] = useState<ModRef | null>(null)
  const [pendingDeps, setPendingDeps] = useState<ModRef[]>([])

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

  function getCurrentItem(ref: ModRef): ModpackMod | undefined {
    return selectedItems.find(
      (m) => m.ref.source === ref.source && m.ref.projectId === ref.projectId
    )
  }

  // Dependency graphs from Modrinth/CurseForge are practically always
  // mod→mod, so required dependencies are always added to project.mods.
  async function checkDependencies(version: ModVersionRef): Promise<void> {
    const required = version.dependencies.filter((d) => d.relation === 'required')
    const missing = required.filter(
      (d) =>
        !project!.mods.some((m) => m.ref.source === d.source && m.ref.projectId === d.projectId)
    )
    if (missing.length === 0) return

    const refs = await window.api.search.resolveRefs(
      missing.map((d) => ({ source: d.source, projectId: d.projectId }))
    )
    setPendingDeps((prev) => {
      const existingKeys = new Set(prev.map((r) => `${r.source}:${r.projectId}`))
      return [...prev, ...refs.filter((r) => !existingKeys.has(`${r.source}:${r.projectId}`))]
    })
  }

  function dismissDependency(ref: ModRef): void {
    setPendingDeps((prev) =>
      prev.filter((r) => !(r.source === ref.source && r.projectId === ref.projectId))
    )
  }

  async function handleAdd(ref: ModRef): Promise<void> {
    const versions = await window.api.search.listVersions(
      ref,
      project!.mcVersion.id,
      project!.loader,
      contentType
    )
    if (versions.length === 0) return
    const version = versions[0]
    addItem(contentType, { ref, pinnedVersion: version, addedAt: new Date().toISOString() })
    if (contentType === 'mod') checkDependencies(version)
  }

  async function handleAddDependency(ref: ModRef): Promise<void> {
    const versions = await window.api.search.listVersions(
      ref,
      project!.mcVersion.id,
      project!.loader,
      'mod'
    )
    if (versions.length === 0) return
    addItem('mod', { ref, pinnedVersion: versions[0], addedAt: new Date().toISOString() })
    dismissDependency(ref)
  }

  async function handleSelectVersion(ref: ModRef, version: ModVersionRef): Promise<void> {
    const current = getCurrentItem(ref)
    if (current) {
      updateVersion(contentType, ref.projectId, ref.source, version)
    } else {
      addItem(contentType, { ref, pinnedVersion: version, addedAt: new Date().toISOString() })
      if (contentType === 'mod') await checkDependencies(version)
    }
    setDetailRef(null)
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
            <c.icon size={15} /> {t(`modBrowser.contentType.${c.id}`)}
            <span className="ct-tab-count">{project[c.field].length}</span>
          </button>
        ))}
      </div>

      <div className="mb-toolbar">
        <div className="mb-search">
          <Search className="mb-search-icon" size={15} />
          <input
            className="input"
            placeholder={t(`modBrowser.searchPlaceholder.${contentType}`)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="segmented">
          {(['both', 'modrinth', 'curseforge'] as SourceFilter[]).map((s) => (
            <button
              key={s}
              className={source === s ? 'seg active' : 'seg'}
              onClick={() => setSource(s)}
            >
              {t(`modBrowser.source.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {source !== 'modrinth' && hasCurseForgeKey === false && (
        <div className="notice warn">{t('modBrowser.noCurseForgeKey')}</div>
      )}
      {error && (
        <div className="notice danger">
          {t('modBrowser.searchError', { message: (error as Error).message })}
        </div>
      )}
      {data?.sourceErrors?.map((se) => (
        <div key={se.source} className="notice warn">
          {t(`modBrowser.sourceError.${se.code}`, {
            source: se.source,
            status: se.status,
            detail: se.detail
          })}
        </div>
      ))}

      {pendingDeps.length > 0 && (
        <div className="notice warn dep-notice">
          <span className="dep-notice-text">{t('modBrowser.dependenciesNeeded')}</span>
          <div className="dep-notice-list">
            {pendingDeps.map((ref) => (
              <div className="dep-notice-item" key={`${ref.source}:${ref.projectId}`}>
                <span>{ref.name}</span>
                <button className="btn btn-ghost" onClick={() => handleAddDependency(ref)}>
                  <Plus size={13} /> {t('modBrowser.add')}
                </button>
                <button
                  className="mbs-remove"
                  onClick={() => dismissDependency(ref)}
                  title={t('modBrowser.dismiss')}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-layout">
        <section className="mb-results">
          {isFetching && <div className="mb-hint">{t('modBrowser.searching')}</div>}
          {!isFetching && data?.refs.length === 0 && (
            <div className="mb-hint">{t('modBrowser.noResults')}</div>
          )}
          {data?.refs.map((ref) => {
            const key = `${ref.source}:${ref.projectId}`
            const added = addedIds.has(key)
            return (
              <article className="mod-card" key={key}>
                <div className="mod-icon">
                  {ref.iconUrl ? <img src={ref.iconUrl} alt="" /> : <Package size={20} />}
                </div>
                <div className="mod-info" onClick={() => setDetailRef(ref)}>
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
                  {added ? <Check size={14} /> : <Plus size={14} />}
                  {added ? t('modBrowser.added') : t('modBrowser.add')}
                </button>
              </article>
            )
          })}
        </section>

        <aside className="mb-selected">
          <div className="mbs-head">
            {t(`modBrowser.selectedLabel.${contentType}`)}{' '}
            <span className="mbs-count">{selectedItems.length}</span>
          </div>
          {selectedItems.length === 0 && <div className="mbs-empty">{t('modBrowser.empty')}</div>}
          <div className="mbs-list">
            {selectedItems.map((m) => (
              <div className="mbs-item" key={`${m.ref.source}:${m.ref.projectId}`}>
                <div className="mbs-item-info" onClick={() => setDetailRef(m.ref)}>
                  <span className="mbs-item-name">{m.ref.name}</span>
                  <span className="mbs-item-version">{m.pinnedVersion.displayName}</span>
                </div>
                <button
                  className="mbs-remove"
                  title={t('modBrowser.remove')}
                  onClick={() => removeItem(contentType, m.ref.projectId, m.ref.source)}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {detailRef && (
        <ModDetail
          modRef={detailRef}
          mcVersion={project.mcVersion.id}
          loader={project.loader}
          contentType={contentType}
          currentVersionId={getCurrentItem(detailRef)?.pinnedVersion.versionId}
          onSelectVersion={(version) => handleSelectVersion(detailRef, version)}
          onClose={() => setDetailRef(null)}
        />
      )}
    </div>
  )
}

export default ModBrowser
