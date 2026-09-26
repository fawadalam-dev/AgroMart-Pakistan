import React, { useState } from 'react'

const cropGuides = {
    Wheat: {
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=84',
        season: 'Rabi season', duration: '120-150 days', sowing: 'November - December',
        description: 'A dependable staple crop. Keep soil evenly moist through early growth and protect young plants from weeds.',
        price: 'Rs. 3,950 / 40 kg', trend: '+ 4.8%', temperature: '26°C', condition: 'Partly cloudy'
    },
    Rice: {
        image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=84',
        season: 'Kharif season', duration: '110-150 days', sowing: 'June - July',
        description: 'Maintain consistent water during transplanting and early growth, then reduce irrigation as grains mature.',
        price: 'Rs. 4,200 / 40 kg', trend: '+ 3.1%', temperature: '29°C', condition: 'Sunny intervals'
    },
    Maize: {
        image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=84',
        season: 'Spring & Kharif', duration: '90-120 days', sowing: 'February - March',
        description: 'Give maize full sun and well-drained soil. Keep rows weed-free while plants establish.',
        price: 'Rs. 2,650 / 40 kg', trend: '+ 2.6%', temperature: '27°C', condition: 'Clear sky'
    },
    Tobacco: {
        image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1200&q=84',
        season: 'Rabi season', duration: '100-130 days', sowing: 'October - November',
        description: 'Start with healthy seedlings and balanced nutrition. Monitor leaves regularly for pest pressure.',
        price: 'Rs. 420 / kg', trend: '+ 5.2%', temperature: '25°C', condition: 'Partly cloudy'
    },
    Vegetables: {
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=84',
        season: 'Year round', duration: '45-120 days', sowing: 'Varies by variety',
        description: 'Rotate vegetable families each season and harvest frequently to support fresh regrowth.',
        price: 'Market varies', trend: 'View mandi rates', temperature: '28°C', condition: 'Partly cloudy'
    },
    Fruits: {
        image: 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=1200&q=84',
        season: 'Varies by variety', duration: 'Seasonal', sowing: 'Consult local calendar',
        description: 'Select varieties suited to your district and plan pruning, irrigation, and harvest by season.',
        price: 'Market varies', trend: 'View mandi rates', temperature: '28°C', condition: 'Partly cloudy'
    }
}

const careStages = [
    { icon: '⌁', title: 'Sowing', detail: 'Use treated, certified seed and prepare a fine, level seedbed.' },
    { icon: '✿', title: 'Fertilizer', detail: 'Apply nutrients in split doses based on a soil test.' },
    { icon: '◉', title: 'Irrigation', detail: 'Water at critical growth stages and avoid standing water.' },
    { icon: '⌕', title: 'Disease watch', detail: 'Scout weekly and confirm symptoms before treatment.' }
]

const timeline = [
    { day: 'Today', task: 'Check soil moisture', status: 'Ready' },
    { day: 'In 2 days', task: 'Irrigation check', status: 'Planned' },
    { day: 'In 5 days', task: 'Inspect new growth', status: 'Planned' },
    { day: 'Next week', task: 'Review crop nutrition', status: 'Upcoming' }
]

export default function Crops() {
    const [selectedCrop, setSelectedCrop] = useState('Wheat')
    const guide = cropGuides[selectedCrop]

    return <section className="crop-dashboard">
        <div className="crop-dashboard-banner">
            <div className="crop-banner-photo" style={{ backgroundImage: `url("${guide.image}")` }} />
            <div className="crop-banner-overlay" />
            <div className="crop-banner-content"><p>Crop guide · {guide.season}</p><h1>{selectedCrop}</h1><span>{guide.description}</span></div>
            <a className="crop-banner-link" href="#/shop">Shop crop inputs <span aria-hidden="true">→</span></a>
        </div>

        <div className="crop-dashboard-layout">
            <aside className="crop-sidebar">
                <div className="crop-sidebar-heading"><span>Crop categories</span><small>6 crops</small></div>
                <nav aria-label="Crop categories">{Object.keys(cropGuides).map((crop) => <button type="button" key={crop} className={selectedCrop === crop ? 'is-active' : ''} onClick={() => setSelectedCrop(crop)}><span className="crop-nav-dot" />{crop}<span aria-hidden="true">›</span></button>)}</nav>
                <a className="crop-sidebar-shop" href="#/shop">Browse all products <span aria-hidden="true">→</span></a>
            </aside>

            <div className="crop-dashboard-main">
                <div className="crop-page-heading"><div><p className="crop-overline">Field notes</p><h2>{selectedCrop} crop plan</h2><p>{guide.description}</p></div><a href="#/assistant">Ask an expert <span aria-hidden="true">↗</span></a></div>
                <div className="crop-facts"><div><small>Growing season</small><strong>{guide.season}</strong></div><div><small>Typical duration</small><strong>{guide.duration}</strong></div><div><small>Recommended sowing</small><strong>{guide.sowing}</strong></div></div>
                <div className="crop-care-grid">{careStages.map((stage) => <article className="crop-care-card" key={stage.title}><span className="crop-care-icon" aria-hidden="true">{stage.icon}</span><div><h3>{stage.title}</h3><p>{stage.detail}</p></div><a href="#/assistant" aria-label={`Get advice about ${stage.title}`}>→</a></article>)}</div>
                <section className="cultivation-timeline"><div className="crop-section-title"><div><p className="crop-overline">This week</p><h2>Cultivation timeline</h2></div><a href="#/profile">View tasks <span aria-hidden="true">→</span></a></div><div className="timeline-track">{timeline.map((item, index) => <article className={index === 0 ? 'timeline-item is-current' : 'timeline-item'} key={item.day}><span className="timeline-marker" /><small>{item.day}</small><strong>{item.task}</strong><span className="timeline-status">{item.status}</span></article>)}</div></section>
                <div className="crop-quick-links"><a href="#/weather"><span>Weather forecast</span><strong>{guide.temperature} · {guide.condition}</strong></a><a href="#/prices"><span>Latest market price</span><strong>{guide.price}</strong></a><a href="#/medicine"><span>Crop health</span><strong>Open disease guide →</strong></a></div>
            </div>

            <aside className="crop-insights">
                <section className="crop-insight-panel"><div className="crop-section-title"><div><p className="crop-overline">Local mandi</p><h2>Market insights</h2></div><a href="#/prices" aria-label="View all market prices">↗</a></div><div className="mandi-price"><span>{selectedCrop}</span><strong>{guide.price}</strong><small>{guide.trend}</small></div><div className="mandi-mini-chart"><i /><i /><i /><i /><i /><i /><i /></div><p className="insight-footnote">Prices may vary by quality and market.</p></section>
                <section className="crop-insight-panel weather-insight"><div className="crop-section-title"><div><p className="crop-overline">Buner, KPK</p><h2>Weather forecast</h2></div><a href="#/weather" aria-label="Open weather page">↗</a></div><div className="crop-weather-now"><span aria-hidden="true">☀</span><strong>{guide.temperature}</strong><small>{guide.condition}</small></div><div className="weather-details"><span>Humidity <strong>65%</strong></span><span>Wind <strong>12 km/h</strong></span><span>Rain chance <strong>10%</strong></span></div></section>
                <a className="crop-advice-link" href="#/assistant"><span className="advice-sparkle" aria-hidden="true">✦</span><span><strong>Need crop advice?</strong><small>Talk with the AI Farm Assistant</small></span><b aria-hidden="true">→</b></a>
            </aside>
        </div>
    </section>
}
