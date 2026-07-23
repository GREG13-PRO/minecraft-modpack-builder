import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/queryClient'
import { useProjectStore } from './state/projectStore'
import ProjectSetup from './screens/ProjectSetup/ProjectSetup'
import ModBrowser from './screens/ModBrowser/ModBrowser'
import Settings from './screens/Settings/Settings'
import './App.css'

type Tab = 'mods' | 'settings'

function AppShell(): React.JSX.Element {
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

  if (restoring) return <div className="app-loading">Betöltés…</div>
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
            <span className="nav-icon">🔍</span> Mod böngésző
          </button>
          <button
            className={tab === 'settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setTab('settings')}
          >
            <span className="nav-icon">⚙️</span> Beállítások
          </button>
        </nav>

        <div className="sidebar-project">
          <div className="sp-label">Aktív projekt</div>
          <div className="sp-name">{project.name}</div>
          <div className="sp-meta">
            <span className="sp-chip">{project.mcVersion.id}</span>
            <span className="sp-chip">{project.loader}</span>
          </div>
          <div className="sp-count">{project.mods.length} mod kiválasztva</div>
          <button className="sp-new" onClick={newProject}>
            + Új projekt
          </button>
        </div>
      </aside>

      <main className="app-main">{tab === 'mods' ? <ModBrowser /> : <Settings />}</main>
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
