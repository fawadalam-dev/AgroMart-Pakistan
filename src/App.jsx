import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Crops from './pages/Crops'
import Order from './pages/Order'
import Login from './pages/Login'
import Register from './pages/Register'
import Chart from './pages/Chart'
import Weather from './pages/Weather'
import MarketPrices from './pages/MarketPrices'
import Footer from './components/Footer'
import About from './pages/About'
import Assistant from './pages/Assistant'
import Admin from './pages/Admin'
import Vendor from './pages/Vendor'
import AgriShop from './pages/AgriShop'

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#/')

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  let Page = <Home />
  if (route === '#/home') Page = <Home />
  if (route === '#/crops') Page = <Crops />
  if (route === '#/order') Page = <Order />
  if (route === '#/login') Page = <Login />
  if (route === '#/register') Page = <Register />
  if (route === '#/chart') Page = <Chart />
  if (route === '#/weather') Page = <Weather />
  if (route === '#/prices') Page = <MarketPrices />
  if (route === '#/about') Page = <About />
  if (route === '#/assistant') Page = <Assistant />
  if (route === '#/admin') Page = <Admin />
  if (route === '#/vendor') Page = <Vendor />
  if (route === '#/shop') Page = <AgriShop />

  const isShopPage = route === '#/crops'

  return (
    <div className="app">
      <Navbar />
      <main className="container">
        {isShopPage ? (
          <div className="shop-layout">
            <div className="shop-content">{Page}</div>
            <aside className="chart-sidebar" aria-label="Cart product chart"><Chart /></aside>
          </div>
        ) : Page}
      </main>
      <Footer />
    </div>
  )
}
