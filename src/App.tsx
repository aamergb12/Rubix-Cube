import { CubeCanvas } from './components/CubeCanvas'
import { useCube } from './hooks/useCube'

export default function App() {
  const cube = useCube()
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CubeCanvas cube={cube} />
    </div>
  )
}