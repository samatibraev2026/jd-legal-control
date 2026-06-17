import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { ProcessView } from './pages/ProcessView'
import { CaseDetail } from './pages/CaseDetail'
import { Deadlines } from './pages/Deadlines'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/deadlines" element={<Layout><Deadlines /></Layout>} />
        <Route path="/process/:id" element={<Layout><ProcessView /></Layout>} />
        <Route path="/process/:id/case/:caseId" element={<Layout><CaseDetail /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
