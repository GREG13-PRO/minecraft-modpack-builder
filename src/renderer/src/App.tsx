import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/queryClient'
import { useProjectStore } from './state/projectStore'
import ProjectSetup from './screens/ProjectSetup/ProjectSetup'
import ModBrowser from './screens/ModBrowser/ModBrowser'

function App(): React.JSX.Element {
  const project = useProjectStore((s) => s.project)

  return (
    <QueryClientProvider client={queryClient}>{project ? <ModBrowser /> : <ProjectSetup />}</QueryClientProvider>
  )
}

export default App
