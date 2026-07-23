import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { ModLoader } from '@shared/types'
import { useProjectStore } from '../../state/projectStore'
import './ProjectSetup.css'

const LOADERS: { id: ModLoader; label: string }[] = [
  { id: 'fabric', label: 'Fabric' },
  { id: 'forge', label: 'Forge' },
  { id: 'neoforge', label: 'NeoForge' },
  { id: 'quilt', label: 'Quilt' }
]

function ProjectSetup(): React.JSX.Element {
  const { t } = useTranslation()
  const createProject = useProjectStore((s) => s.createProject)
  const [name, setName] = useState(t('projectSetup.defaultProjectName'))
  const [mcVersion, setMcVersion] = useState('')
  const [loader, setLoader] = useState<ModLoader>('fabric')

  const { data: gameVersions, isLoading } = useQuery({
    queryKey: ['gameVersions'],
    queryFn: () => window.api.search.gameVersions()
  })

  const effectiveVersion = mcVersion || gameVersions?.[0] || ''

  return (
    <div className="project-setup">
      <div className="setup-card">
        <div className="setup-head">
          <span className="setup-mark">⛏</span>
          <h1>{t('projectSetup.title')}</h1>
          <p className="setup-sub">{t('projectSetup.subtitle')}</p>
        </div>

        <label className="field">
          <span className="field-label">{t('projectSetup.projectName')}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">{t('projectSetup.minecraftVersion')}</span>
          <select
            className="input"
            value={effectiveVersion}
            onChange={(e) => setMcVersion(e.target.value)}
            disabled={isLoading}
          >
            {isLoading && <option>{t('projectSetup.loadingVersions')}</option>}
            {gameVersions?.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span className="field-label">{t('projectSetup.modLoader')}</span>
          <div className="loader-grid">
            {LOADERS.map((l) => (
              <button
                key={l.id}
                className={loader === l.id ? 'loader-option active' : 'loader-option'}
                onClick={() => setLoader(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn setup-submit"
          disabled={!effectiveVersion || !name.trim()}
          onClick={() => createProject(name.trim(), effectiveVersion, loader)}
        >
          {t('projectSetup.createProject')}
        </button>
      </div>
    </div>
  )
}

export default ProjectSetup
