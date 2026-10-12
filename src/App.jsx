import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import FarmerManagement from './pages/FarmerManagement'
import Order from './pages/Order'
import Auth from './pages/Auth'
import Weather from './pages/Weather'
import MarketPrices from './pages/MarketPrices'
import Footer from './components/Footer'
import About from './pages/About'
import Faq from './pages/Faq'
import Assistant from './pages/Assistant'
import Admin from './pages/Admin'
import AgriShop from './pages/AgriShop'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { getSession, setSession } from './utils/auth'

function readTheme() {
  const saved = localStorage.getItem('agro_theme')
  try { return JSON.parse(saved) === 'dark' } catch { return saved === 'dark' }
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#/')
  const [darkMode, setDarkMode] = useState(readTheme)

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const updateTheme = (event) => setDarkMode(event.detail === 'dark' || readTheme())
    window.addEventListener('agro-theme-updated', updateTheme)
    return () => window.removeEventListener('agro-theme-updated', updateTheme)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('oauth_token')
    const encodedUser = params.get('oauth_user')
    if (!token || !encodedUser) return
    try {
      setSession(JSON.parse(encodedUser), token)
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
    } catch { }
  }, [])

  let Page = <Home />
  if (route === '#/home') Page = <Home />
  if (route === '#/crops') Page = <AgriShop initialSection="crops" />
  if (route === '#/seeds') Page = <AgriShop initialSection="seeds" />
  if (route === '#/medicine') Page = <AgriShop initialSection="medicine" />
  if (route === '#/order') Page = <Order />
  if (route === '#/login') Page = <Auth initialMode="login" />
  if (route === '#/register') Page = <Auth initialMode="register" />
  if (route === '#/weather') Page = <Weather />
  if (route === '#/prices') Page = <MarketPrices />
  if (route === '#/about') Page = <About />
  if (route === '#/faq') Page = <Faq />
  if (route === '#/assistant') Page = <Assistant />
  if (route === '#/admin') Page = <Admin />
  if (route === '#/farmer-dashboard' && getSession()?.role === 'farmer') return <FarmerManagement />
  if (route === '#/farmer-dashboard') Page = <Auth initialMode="login" />
  if (route === '#/shop') Page = <AgriShop />
  if (route === '#/profile') Page = <Profile />
  if (route === '#/settings') Page = <Settings />

  const isHomePage = route === '#/' || route === '#/home'
  return (
    <div className={`app site-app${isHomePage ? ' home-app' : ''}${darkMode ? ' app-dark' : ''}`}>
      <Navbar />
      <main className={`container${isHomePage ? ' home-container' : ''}`}>
        {Page}
      </main>
      <Footer />
    </div>
  )
}
