import { useState } from 'react'
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
  const [tab, setTab] = useState<Tab>('mods')

  if (!project) return <ProjectSetup />

  return (
    <div className="app-shell">
      <nav className="tabs">
        <button className={tab === 'mods' ? 'active' : ''} onClick={() => setTab('mods')}>
          Mod Browser
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          Beállítások
        </button>
      </nav>
      {tab === 'mods' ? <ModBrowser /> : <Settings />}
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
