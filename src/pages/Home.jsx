import React, { useMemo } from 'react'

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

    return (
        <section className="storefront-page">
            <section className="storefront-hero" aria-labelledby="storefront-title">
                <div className="storefront-hero-image" role="img" aria-label="Sunlit green fields in Pakistan" />
                <div className="storefront-hero-shade" />
                <div className="storefront-location"><span aria-hidden="true">⌖</span><select aria-label="Select your location" defaultValue="Buner, Khyber Pakhtunkhwa, Pakistan"><option>Buner, Khyber Pakhtunkhwa, Pakistan</option><option>Peshawar, Khyber Pakhtunkhwa, Pakistan</option><option>Lahore, Punjab, Pakistan</option><option>Karachi, Sindh, Pakistan</option></select></div>
                <div className="storefront-hero-copy">
                    <p className="storefront-kicker">Grow with confidence</p>
                    <h1 id="storefront-title">Smart Farming.<br /><span>Better Harvest.</span></h1>
                    <p>Buy farm inputs, sell your crops, check weather updates and get expert advice, all in one place.</p>
                    <div className="storefront-hero-actions"><a className="button-primary" href="#/crops">Explore Agriculture <span aria-hidden="true">→</span></a><a className="button-light" href="#/login"><span aria-hidden="true">♟</span> Sell Your Crop</a></div>
                </div>
                <div className="storefront-hero-note"><span>Supporting Farmers</span><strong>Building a<br />Stronger Pakistan</strong><i /></div>
            </section>

            <div className="storefront-content">
                <section className="quick-services" aria-label="Agriculture services">
                    <a className="service-tile" href="#/weather"><span className="service-icon weather-icon" aria-hidden="true">☀</span><span><strong>Weather Updates</strong><small>Get real-time weather forecast for your area and plan better.</small></span><b aria-hidden="true">→</b></a>
                    <a className="service-tile" href="#/prices"><span className="service-icon market-icon" aria-hidden="true">▥</span><span><strong>Mandi Prices</strong><small>Check the latest crop prices in local and regional mandis.</small></span><b aria-hidden="true">→</b></a>
                    <a className="service-tile" href="#/medicine"><span className="service-icon crop-icon" aria-hidden="true">❧</span><span><strong>Crop Disease Detection</strong><small>Identify plant diseases with AI and get treatment advice.</small></span><b aria-hidden="true">→</b></a>
                    <a className="service-tile" href="#/assistant"><span className="service-icon assistant-icon" aria-hidden="true">✦</span><span><strong>AI Farm Assistant</strong><small>Ask anything about farming, crops, soil, and more.</small></span><b aria-hidden="true">→</b></a>
                </section>

                <section className="showcase-section crop-showcase">
                    <div className="showcase-heading"><div><p className="section-eyebrow">Our crops</p><h2>Explore Popular Crops</h2></div><a href="#/crops">View all crops <span aria-hidden="true">→</span></a></div>
                    <div className="crop-showcase-grid">{crops.map((crop) => <a className="crop-showcase-card" href="#/crops" key={crop.name}><img src={crop.image} alt={`${crop.name} crop`} loading="lazy" /><span className="crop-card-caption"><strong>{crop.name}</strong><small>{crop.note}</small><b aria-hidden="true">→</b></span></a>)}</div>
                </section>

                <section className="showcase-section product-showcase">
                    <div className="showcase-heading"><div><p className="section-eyebrow">Featured products</p><h2>Agri Shop — Quality Inputs for Better Yield</h2></div><a href="#/shop">View all products <span aria-hidden="true">→</span></a></div>
                    <div className="featured-product-grid">{products.map((product, index) => <article className="featured-product-card" key={`${product.name}-${index}`}><a className="featured-product-image" href="#/shop"><img src={product.image} alt={product.name} loading="lazy" /><span>{product.category}</span></a><div className="featured-product-copy"><strong>{product.name}</strong><p>{product.description}</p><b>{product.price}</b><a className="product-shop-link" href="#/shop">View in shop <span aria-hidden="true">→</span></a></div></article>)}</div>
                </section>

                <section className="farmer-dashboard-preview" aria-label="Farmer dashboard preview">
                    <div className="dashboard-rail"><div><p className="section-eyebrow">Farmer dashboard</p><h2>Make better farm decisions.</h2><p>Manage your farm, track progress and make decisions with real-time data.</p></div><nav aria-label="Dashboard preview sections"><a className="is-selected" href="#/profile">Farm Overview</a><a href="#/assistant">Crop Health</a><a href="#/profile">Upcoming Tasks</a><a href="#/prices">Market Prices</a><a href="#/weather">Weather Forecast</a></nav><a className="dashboard-button" href="#/login">Go to Dashboard <span aria-hidden="true">→</span></a></div>
                    <div className="dashboard-main"><div className="dashboard-greeting"><span className="farmer-avatar">FA</span><span><strong>Hello, Farmer</strong><small>Farm overview</small></span><span className="dashboard-location">⌖ Buner, KPK</span></div><div className="dashboard-stats"><div><span>▥</span><small>Total Farm Area</small><strong>5.2 Acres</strong></div><div><span>❧</span><small>Active Crops</small><strong>3</strong></div><div><span>♥</span><small>Crop Health</small><strong>Healthy</strong></div></div><div className="dashboard-widgets"><article className="task-widget"><strong>Upcoming Tasks</strong><small>Today</small><p><i /> Irrigation for Wheat <small>Tomorrow · 6:00 AM</small></p><p><i /> Fertilizer Application <small>2 days later · 8:00 AM</small></p><p><i /> Pest Monitoring <small>5 days later · 9:00 AM</small></p><a href="#/profile">View all tasks →</a></article><article className="price-widget"><strong>Market Prices <small>(Tobacco)</small></strong><b>Rs. 420/kg <em>↗ 5.2%</em></b><div className="price-chart" aria-label="Market prices rising this week"><svg viewBox="0 0 300 90" role="img" aria-hidden="true"><path d="M0 72 L34 56 L67 66 L100 43 L132 51 L166 30 L199 38 L232 22 L265 30 L300 8" /><path className="chart-fill" d="M0 72 L34 56 L67 66 L100 43 L132 51 L166 30 L199 38 L232 22 L265 30 L300 8 L300 90 L0 90 Z" /></svg><div><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></article><article className="weather-widget"><strong>28°C</strong><span>Partly Cloudy</span><small>Humidity 65%<br />Wind 12 km/h</small></article></div></div>
                </section>
            </div>
        </section>
    )
}
