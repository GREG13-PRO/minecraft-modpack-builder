import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Pickaxe, RefreshCw } from 'lucide-react'
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
  const [manualEntry, setManualEntry] = useState(false)
  const [loader, setLoader] = useState<ModLoader>('fabric')

  const {
    data: gameVersions,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['gameVersions'],
    queryFn: () => window.api.search.gameVersions()
  })

  const hasVersionList = !isError && (gameVersions?.length ?? 0) > 0
  // If the live list never loads (network/firewall issue), fall back to a
  // free-text field instead of leaving the user stuck with an empty,
  // permanently-disabled dropdown and no way to proceed.
  const showManualInput = manualEntry || (!isLoading && !hasVersionList)

  const effectiveVersion = showManualInput ? mcVersion : mcVersion || gameVersions?.[0] || ''

  return (
    <div className="project-setup">
      <div className="setup-card">
        <div className="setup-head">
          <span className="setup-mark">
            <Pickaxe size={26} strokeWidth={2} />
          </span>
          <h1>{t('projectSetup.title')}</h1>
          <p className="setup-sub">{t('projectSetup.subtitle')}</p>
        </div>

        <label className="field">
          <span className="field-label">{t('projectSetup.projectName')}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">{t('projectSetup.minecraftVersion')}</span>
          {showManualInput ? (
            <input
              className="input"
              placeholder={t('projectSetup.versionPlaceholder')}
              value={mcVersion}
              onChange={(e) => setMcVersion(e.target.value)}
            />
          ) : (
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
          )}

          {!isLoading && !hasVersionList && (
            <p className="field-hint warn">
              {t('projectSetup.versionsUnavailable')}{' '}
              <button className="link-btn" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw size={12} /> {t('projectSetup.retry')}
              </button>
            </p>
          )}
          {!showManualInput && hasVersionList && (
            <button className="link-btn" onClick={() => setManualEntry(true)}>
              {t('projectSetup.enterManually')}
            </button>
          )}
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
          disabled={!effectiveVersion.trim() || !name.trim()}
          onClick={() => createProject(name.trim(), effectiveVersion.trim(), loader)}
        >
          {t('projectSetup.createProject')}
        </button>
      </div>
    </div>
  )
}

export default ProjectSetup
