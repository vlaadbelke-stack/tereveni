import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ServicePage from './ServicePage.tsx'
import AboutPage from './AboutPage.tsx'
import PortfolioPage from './PortfolioPage.tsx'
import AdminPage from './AdminPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
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
