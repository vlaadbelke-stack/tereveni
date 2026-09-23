import { StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ServicePage from './ServicePage.tsx'
import AboutPage from './AboutPage.tsx'
import PortfolioPage from './PortfolioPage.tsx'
import AdminPage from './AdminPage.tsx'

/* Meta Pixel: перший PageView шле сніпет в index.html, тут — переходи всередині SPA. */
function PixelPageView() {
  const { pathname } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    ;(window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.('track', 'PageView')
  }, [pathname])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PixelPageView />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/service/:slug" element={<ServicePage />} />
        <Route path="/pro-nas" element={<AboutPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/admin" element={<AdminPage />} />
        {/* 12.08: без цього будь-який невідомий шлях рендерив ПОРОЖНЮ сторінку
            (білий екран замість сайту) — битий лінк виглядав як зламаний сайт. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
