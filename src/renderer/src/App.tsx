import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { queryClient } from './api/queryClient'
import { useProjectStore } from './state/projectStore'
import ProjectSetup from './screens/ProjectSetup/ProjectSetup'
import ModBrowser from './screens/ModBrowser/ModBrowser'
import InstalledScan from './screens/InstalledScan/InstalledScan'
import Export from './screens/Export/Export'
import Settings from './screens/Settings/Settings'
import './App.css'

type Tab = 'mods' | 'scan' | 'export' | 'settings'

function AppShell(): React.JSX.Element {
  const { t } = useTranslation()
  const project = useProjectStore((s) => s.project)
  const loadProject = useProjectStore((s) => s.loadProject)
  const newProject = useProjectStore((s) => s.newProject)
  const [tab, setTab] = useState<Tab>('mods')
  const [restoring, setRestoring] = useState(true)

  // Reopen the most recently edited project on startup.
  useEffect(() => {
    window.api.projects.list().then((projects) => {
      if (projects.length > 0) loadProject(projects[0])
      setRestoring(false)
    })
  }, [loadProject])

  if (restoring) return <div className="app-loading">{t('app.loading')}</div>
  if (!project) return <ProjectSetup />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">⛏</span>
          <span className="brand-name">Modpack Builder</span>
        </div>

        <nav className="sidebar-nav">
          <button className={tab === 'mods' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('mods')}>
            <span className="nav-icon">🔍</span> {t('app.nav.modBrowser')}
          </button>
          <button className={tab === 'scan' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('scan')}>
            <span className="nav-icon">📂</span> {t('app.nav.installedScan')}
          </button>
          <button className={tab === 'export' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('export')}>
            <span className="nav-icon">📤</span> {t('app.nav.export')}
          </button>
          <button
            className={tab === 'settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setTab('settings')}
          >
            <span className="nav-icon">⚙️</span> {t('app.nav.settings')}
          </button>
        </nav>

        <div className="sidebar-project">
          <div className="sp-label">{t('app.sidebar.activeProject')}</div>
          <div className="sp-name">{project.name}</div>
          <div className="sp-meta">
            <span className="sp-chip">{project.mcVersion.id}</span>
            <span className="sp-chip">{project.loader}</span>
          </div>
          <div className="sp-count">
            {t('app.sidebar.counts', {
              mods: project.mods.length,
              resourcePacks: project.resourcePacks.length,
              shaders: project.shaders.length
            })}
          </div>
          <button className="sp-new" onClick={newProject}>
            {t('app.sidebar.newProject')}
          </button>
        </div>
      </aside>

      <main className="app-main">
        {tab === 'mods' && <ModBrowser />}
        {tab === 'scan' && <InstalledScan />}
        {tab === 'export' && <Export />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  )
}

export default App
