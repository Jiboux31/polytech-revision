import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RevisionPlan from './pages/RevisionPlan'
import QCM from './pages/QCM'
import QCMResult from './pages/QCMResult'
import Dashboard from './pages/Dashboard'
import ExerciceRedige from './pages/ExerciceRedige'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<RevisionPlan />} />
        <Route path="/qcm/:exerciseId" element={<QCM />} />
        <Route path="/qcm/:exerciseId/result" element={<QCMResult />} />
        <Route path="/redige/:exerciseId" element={<ExerciceRedige />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
