import { Routes, Route } from 'react-router-dom'
import TinaApp from './TinaApp'
import ViewerPage from './components/ViewerPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TinaApp />} />
      <Route path="/viewer" element={<ViewerPage />} />
    </Routes>
  )
}

export default App
