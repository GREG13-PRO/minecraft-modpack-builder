import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ModRef } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './ModBrowser.css'

function ModBrowser(): React.JSX.Element {
  const project = useProjectStore((s) => s.project)
  const addMod = useProjectStore((s) => s.addMod)
  const removeMod = useProjectStore((s) => s.removeMod)
  const [query, setQuery] = useState('')

  const { data, isFetching, error } = useQuery({
    queryKey: ['modSearch', query, project?.mcVersion.id, project?.loader],
    queryFn: () =>
      window.api.search.searchMods({
        query,
        mcVersion: project!.mcVersion.id,
        loader: project!.loader,
        source: 'modrinth'
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
      <header>
        <h2>
          {project.name} — {project.mcVersion.id} ({project.loader})
        </h2>
        <input
          placeholder="Mod keresése..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      {isFetching && <p>Keresés...</p>}
      {error && <p className="error">Hiba a keresés során: {(error as Error).message}</p>}

      <ul className="results">
        {data?.refs.map((ref) => {
          const key = `${ref.source}:${ref.projectId}`
          const added = addedIds.has(key)
          return (
            <li key={key}>
              {ref.iconUrl && <img src={ref.iconUrl} alt="" />}
              <div className="info">
                <strong>{ref.name}</strong>
                <span>{ref.summary}</span>
              </div>
              <button disabled={added} onClick={() => handleAdd(ref)}>
                {added ? 'Hozzáadva' : 'Hozzáadás'}
              </button>
            </li>
          )
        })}
      </ul>

      <section className="selected-mods">
        <h3>Kiválasztott modok ({project.mods.length})</h3>
        <ul>
          {project.mods.map((m) => (
            <li key={`${m.ref.source}:${m.ref.projectId}`}>
              {m.ref.name} — {m.pinnedVersion.displayName}
              <button onClick={() => removeMod(m.ref.projectId, m.ref.source)}>Eltávolítás</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default ModBrowser
