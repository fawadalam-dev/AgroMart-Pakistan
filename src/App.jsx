import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Crops from './pages/Crops'
import Seeds from './pages/Seeds'
import Order from './pages/Order'
import Login from './pages/Login'
import Register from './pages/Register'
import Weather from './pages/Weather'
import MarketPrices from './pages/MarketPrices'
import Footer from './components/Footer'
import About from './pages/About'
import Faq from './pages/Faq'
import Assistant from './pages/Assistant'
import Admin from './pages/Admin'
import AgriShop from './pages/AgriShop'
import Medicine from './pages/Medicine'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { setSession } from './utils/auth'

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#/')

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
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
  if (route === '#/crops') Page = <Crops />
    if (route === '#/seeds') Page = <Seeds />
  if (route === '#/order') Page = <Order />
  if (route === '#/login') Page = <Login />
  if (route === '#/register') Page = <Register />
  if (route === '#/weather') Page = <Weather />
  if (route === '#/prices') Page = <MarketPrices />
  if (route === '#/about') Page = <About />
  if (route === '#/faq') Page = <Faq />
  if (route === '#/assistant') Page = <Assistant />
  if (route === '#/admin') Page = <Admin />
  if (route === '#/shop') Page = <AgriShop />
  if (route === '#/medicine') Page = <Medicine />
  if (route === '#/profile') Page = <Profile />
  if (route === '#/settings') Page = <Settings />

  const isHomePage = route === '#/' || route === '#/home'
  const isCropPage = route === '#/crops'

  return (
    <div className={`app site-app${isHomePage || isCropPage ? ' home-app' : ''}${isCropPage ? ' crop-dashboard-app' : ''}`}>
      <Navbar />
      <main className={`container${isHomePage ? ' home-container' : ''}${isCropPage ? ' crop-dashboard-container' : ''}`}>
        {Page}
      </main>
      <Footer />
    </div>
  )
}
