import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Home from './pages/Home'
import RevisionPlan from './pages/RevisionPlan'
import QCM from './pages/QCM'
import QCMResult from './pages/QCMResult'
import Dashboard from './pages/Dashboard'
import Simulation from './pages/Simulation'
import QCMGenere from './pages/QCMGenere'

const ExerciceRedige = lazy(() => import('./pages/ExerciceRedige'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="container">Chargement...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plan" element={<RevisionPlan />} />
          <Route path="/qcm/:exerciseId" element={<QCM />} />
          <Route path="/qcm/:exerciseId/result" element={<QCMResult />} />
          <Route path="/redige/:exerciseId" element={<ExerciceRedige />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/qcm-genere" element={<QCMGenere />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
