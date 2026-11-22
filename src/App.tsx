import { HashRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n'
import { SessionProvider } from './state/SessionProvider'
import { TopBar } from './components/TopBar'
import { BottomNav } from './components/BottomNav'
import { HomePage } from './pages/HomePage'
import { QuestionFlowPage } from './pages/QuestionFlowPage'
import { ResultsPage } from './pages/ResultsPage'
import { HouseholdPage } from './pages/HouseholdPage'
import { TrackerPage } from './pages/TrackerPage'
import { HelpCentresPage } from './pages/HelpCentresPage'
import { ScamCheckPage } from './pages/ScamCheckPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { AssistedModePage } from './pages/AssistedModePage'

function App() {
  return (
    <I18nProvider>
      <SessionProvider>
        <HashRouter>
          <a href="#main-content" className="visually-hidden-focusable">
            Skip to content
          </a>
          <TopBar />
          <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/question" element={<QuestionFlowPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/household" element={<HouseholdPage />} />
              <Route path="/tracker" element={<TrackerPage />} />
              <Route path="/help-centres" element={<HelpCentresPage />} />
              <Route path="/scam-check" element={<ScamCheckPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/assisted" element={<AssistedModePage />} />
            </Routes>
          </main>
          <BottomNav />
        </HashRouter>
      </SessionProvider>
    </I18nProvider>
  )
}

export default App
