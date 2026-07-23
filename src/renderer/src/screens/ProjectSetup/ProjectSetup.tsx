import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ModLoader } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './ProjectSetup.css'

const LOADERS: ModLoader[] = ['fabric', 'forge', 'neoforge', 'quilt']

function ProjectSetup(): React.JSX.Element {
  const createProject = useProjectStore((s) => s.createProject)
  const [name, setName] = useState('Új modpack')
  const [mcVersion, setMcVersion] = useState('')
  const [loader, setLoader] = useState<ModLoader>('fabric')

  const { data: gameVersions, isLoading } = useQuery({
    queryKey: ['gameVersions'],
    queryFn: () => window.api.search.gameVersions()
  })

  const effectiveVersion = mcVersion || gameVersions?.[0] || ''

  return (
    <div className="project-setup">
      <h1>Új modpack projekt</h1>
      <label>
        Projekt neve
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Minecraft verzió
        <select value={effectiveVersion} onChange={(e) => setMcVersion(e.target.value)} disabled={isLoading}>
          {isLoading && <option>Betöltés...</option>}
          {gameVersions?.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mod loader
        <select value={loader} onChange={(e) => setLoader(e.target.value as ModLoader)}>
          {LOADERS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={!effectiveVersion || !name.trim()}
        onClick={() => createProject(name.trim(), effectiveVersion, loader)}
      >
        Projekt létrehozása
      </button>
    </div>
  )
}

export default ProjectSetup
