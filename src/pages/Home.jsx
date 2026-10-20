import React, { useMemo, useState } from 'react'
import { getSession } from '../utils/auth'
import { pakistanLocations } from '../utils/pakistanLocations'

const DEFAULT_LOCATION = { city: 'Buner', province: 'Khyber Pakhtunkhwa' }

function readLocation() {
    const session = getSession()
    try {
        if (session?.id) {
            const account = JSON.parse(localStorage.getItem(`agro_account_${session.id}`) || localStorage.getItem(`agro_customer_${session.id}`) || 'null')
            if (account?.city && pakistanLocations[account.province]?.includes(account.city)) {
                return { city: account.city, province: account.province }
            }
        }
    } catch { }
    return DEFAULT_LOCATION
}

const crops = [
    { name: 'Wheat', note: 'High demand | Good profit', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=640&q=82' },
    { name: 'Rice', note: 'Stable market | Reliable', image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=640&q=82' },
    { name: 'Maize', note: 'Quick growth | Good yield', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=640&q=82' },
    { name: 'Tobacco', note: 'Premium quality | High value', image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=640&q=82' },
    { name: 'Vegetables', note: 'Fresh & healthy | High demand', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=640&q=82' }
]

const featuredProducts = [
    { name: 'Hybrid Seeds', category: 'Seeds', description: 'High quality hybrid seeds for better production.', price: 'Rs. 2,800', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=640&q=82' },
    { name: 'Urea Fertilizer', category: 'Fertilizer', description: 'Nutrient rich fertilizer for healthy crop growth.', price: 'Rs. 3,500', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=640&q=82' },
    { name: 'Crop Protection', category: 'Pesticides', description: 'Protect your crops from pests and diseases.', price: 'Rs. 1,200', image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=640&q=82' },
    { name: 'Farm Machinery', category: 'Machinery', description: 'Modern tools for smart farming and high productivity.', price: 'Rs. 85,000', image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=640&q=82' }
]

function readProducts() {
    try {
        const stored = JSON.parse(localStorage.getItem('agro_products') || '[]')
        return Array.isArray(stored) ? stored.filter((product) => product.status === 'approved') : []
    } catch { return [] }
}

export default function Home() {
    const session = getSession()
    const canSetLocation = ['customer', 'farmer'].includes(session?.role)
    const [location, setLocation] = useState(readLocation)
    const products = useMemo(() => {
        const stored = readProducts()
        return stored.length ? stored.slice(0, 4).map((product) => ({
            name: product.name,
            category: product.category || 'Farm input',
            description: product.details || 'Quality farm input for a stronger growing season.',
            price: `Rs. ${Number(product.price || 0).toLocaleString()}`,
            image: product.image
        })) : featuredProducts
    }, [])

    function updateLocation(event) {
        const [city, province] = event.target.value.split('|')
        const nextLocation = { city, province }
        setLocation(nextLocation)
        const session = getSession()
        if (!session?.id) return
        const accountKey = `agro_account_${session.id}`
        let account = {}
        try {
            account = JSON.parse(localStorage.getItem(accountKey) || localStorage.getItem(`agro_customer_${session.id}`) || '{}')
        } catch { }
        localStorage.setItem(accountKey, JSON.stringify({ ...account, city, province }))
    }

    return (
        <section className={`storefront-page${canSetLocation ? '' : ' storefront-page--guest'}`}>
            <section className="storefront-hero" aria-labelledby="storefront-title">
                <div className="storefront-hero-image" role="img" aria-label="Sunlit green fields in Pakistan" />
                <div className="storefront-hero-shade" />
                {canSetLocation && <label className="storefront-location"><span aria-hidden="true">⌖</span><select aria-label="Select your location" value={`${location.city}|${location.province}`} onChange={updateLocation}>{Object.entries(pakistanLocations).flatMap(([province, cities]) => cities.map((city) => <option key={`${province}-${city}`} value={`${city}|${province}`}>{city}, {province}, Pakistan</option>))}</select></label>}
                <div className="storefront-hero-copy">
                    <p className="storefront-kicker">Grow with confidence</p>
                    <h1 id="storefront-title">Smart Farming.<br /><span>Better Harvest.</span></h1>
                    <p>Buy farm inputs, sell your crops, check weather updates and get expert advice, all in one place.</p>
                    <div className="storefront-hero-actions"><a className="button-primary" href="#/crops">Explore Agriculture <span aria-hidden="true">→</span></a><a className="button-light" href="#/login"><span aria-hidden="true">♟</span> Sell Your Crop</a></div>
                </div>
                <div className="storefront-hero-note"><span>Supporting Farmers</span><strong>Building a<br />Stronger Pakistan</strong><i /></div>
            </section>

            <div className="storefront-content">
                <section className="showcase-section crop-showcase">
                    <div className="showcase-heading"><div><p className="section-eyebrow">Our crops</p><h2>Explore Popular Crops</h2></div><a href="#/crops">View all crops <span aria-hidden="true">→</span></a></div>
                    <div className="crop-showcase-grid">{crops.map((crop) => <a className="crop-showcase-card" href="#/crops" key={crop.name}><img src={crop.image} alt={`${crop.name} crop`} loading="lazy" /><span className="crop-card-caption"><strong>{crop.name}</strong><small>{crop.note}</small><b aria-hidden="true">→</b></span></a>)}</div>
                </section>

                <section className="showcase-section product-showcase">
                    <div className="showcase-heading"><div><p className="section-eyebrow">Featured products</p><h2>Agri Shop — Quality Inputs for Better Yield</h2></div><a href="#/shop">View all products <span aria-hidden="true">→</span></a></div>
                    <div className="featured-product-grid">{products.map((product, index) => <article className="featured-product-card" key={`${product.name}-${index}`}><a className="featured-product-image" href="#/shop"><img src={product.image} alt={product.name} loading="lazy" /><span>{product.category}</span></a><div className="featured-product-copy"><strong>{product.name}</strong><p>{product.description}</p><b>{product.price}</b><a className="product-shop-link" href="#/shop">View in shop <span aria-hidden="true">→</span></a></div></article>)}</div>
                </section>

                {session?.role !== 'farmer' && <section className="farmer-dashboard-preview" aria-label="Farmer dashboard preview">
                    <div className="dashboard-rail"><div><p className="section-eyebrow">Farmer dashboard</p><h2>Make better farm decisions.</h2><p>Manage your farm, track progress and make decisions with real-time data.</p></div><nav aria-label="Dashboard preview sections"><a className="is-selected" href="#/farmer-dashboard">Farm Overview</a><a href="#/assistant">Crop Health</a><a href="#/farmer-dashboard">Land &amp; Expenses</a><a href="#/prices">Market Prices</a><a href="#/weather">Weather Forecast</a></nav><a className="dashboard-button" href={session ? '#/farmer-dashboard' : '#/login'}>{session ? 'Create / Open Dashboard' : 'Sign in to Create Dashboard'} <span aria-hidden="true">→</span></a></div>
                    <div className="dashboard-main"><div className="dashboard-greeting"><span className="farmer-avatar">FA</span><span><strong>Hello, Farmer</strong><small>Farm overview</small></span><span className="dashboard-location">⌖ {location.city}, {location.province}</span></div><div className="dashboard-stats"><div><span>▥</span><small>Total Farm Area</small><strong>5.2 Acres</strong></div><div><span>❧</span><small>Active Crops</small><strong>3</strong></div><div><span>♥</span><small>Crop Health</small><strong>Healthy</strong></div></div><div className="dashboard-widgets"><article className="task-widget"><strong>Upcoming Tasks</strong><small>Today</small><p><i /> Irrigation for Wheat <small>Tomorrow · 6:00 AM</small></p><p><i /> Fertilizer Application <small>2 days later · 8:00 AM</small></p><p><i /> Pest Monitoring <small>5 days later · 9:00 AM</small></p><a href="#/profile">View all tasks →</a></article><article className="price-widget"><strong>Market Prices <small>(Tobacco)</small></strong><b>Rs. 420/kg <em>↗ 5.2%</em></b><div className="price-chart" aria-label="Market prices rising this week"><svg viewBox="0 0 300 90" role="img" aria-hidden="true"><path d="M0 72 L34 56 L67 66 L100 43 L132 51 L166 30 L199 38 L232 22 L265 30 L300 8" /><path className="chart-fill" d="M0 72 L34 56 L67 66 L100 43 L132 51 L166 30 L199 38 L232 22 L265 30 L300 8 L300 90 L0 90 Z" /></svg><div><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></article><article className="weather-widget"><strong>28°C</strong><span>Partly Cloudy</span><small>Humidity 65%<br />Wind 12 km/h</small></article></div></div>
                </section>}
            </div>
        </section>
    )
}
