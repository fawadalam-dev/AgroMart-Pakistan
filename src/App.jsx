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
import Assistant from './pages/Assistant'
import Admin from './pages/Admin'
import AgriShop from './pages/AgriShop'
import Medicine from './pages/Medicine'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { getUsers, saveUsers } from './utils/auth'

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#/')

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('agro_products') || '[]')
      if (!Array.isArray(stored)) return
      const cleaned = stored.filter((product) => product.id?.startsWith('admin-'))
      if (cleaned.length !== stored.length) {
        localStorage.setItem('agro_products', JSON.stringify(cleaned))
        window.dispatchEvent(new Event('agro-products-updated'))
      }
      const users = getUsers()
      const customerOrAdminUsers = users.filter((user) => user.role === 'customer' || user.role === 'admin')
      if (customerOrAdminUsers.length !== users.length) saveUsers(customerOrAdminUsers)
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
  if (route === '#/assistant') Page = <Assistant />
  if (route === '#/admin') Page = <Admin />
  if (route === '#/shop') Page = <AgriShop />
  if (route === '#/medicine') Page = <Medicine />
  if (route === '#/profile') Page = <Profile />
  if (route === '#/settings') Page = <Settings />

  const isShopPage = route === '#/crops'

  return (
    <div className="app">
      <Navbar />
      <main className="container">
        {isShopPage ? <div className="shop-content">{Page}</div> : Page}
      </main>
      <Footer />
    </div>
  )
}
