import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { EveningBackground } from './components/EveningBackground'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { EveningMoodProvider } from './context/EveningMoodProvider'
import { LanguageProvider } from './i18n/LanguageContext'
import { AboutPage } from './pages/AboutPage'
import { ComparePage } from './pages/ComparePage'
import { HomePage } from './pages/HomePage'
import { ProblemPage } from './pages/ProblemPage'
import { ProfilePage } from './pages/ProfilePage'
import { SolutionPage } from './pages/SolutionPage'

/** Every page opens on its hero, so a route change starts at the top. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function AppShell() {
  return (
    <div id="top" className="relative min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)]">
      <ScrollToTop />
      <EveningBackground />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/problem" element={<ProblemPage />} />
          <Route path="/solution" element={<SolutionPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <EveningMoodProvider>
        <AppShell />
      </EveningMoodProvider>
    </LanguageProvider>
  )
}

export default App
