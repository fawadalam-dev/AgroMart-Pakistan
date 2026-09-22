import React, { useEffect, useState } from 'react'

const commodities = [
  { name: 'Wheat', unit: 'PKR / 40 kg', fallback: 10500, details: 'A staple grain used for flour, bread, and livestock feed.' },
  { name: 'Corn', unit: 'PKR / 40 kg', fallback: 8900, details: 'A versatile crop used for food, animal feed, and industry.' },
  { name: 'Cotton', unit: 'PKR / maund', fallback: 8500, details: 'A major fiber crop supporting textile and agricultural markets.' },
  { name: 'Sugar', unit: 'PKR / 50 kg', fallback: 7800, details: 'A daily-use commodity processed from sugarcane.' },
  { name: 'Rice', unit: 'PKR / 40 kg', fallback: 12500, details: 'A major Pakistani crop for local consumption and export.' }
]

const additionalProducts = [
  ['Rice', 520, 'A staple cereal crop grown widely across Pakistan.'],
  ['Maize', 190, 'A high-value grain used for food, feed, and industry.'],
  ['Sugarcane', 42, 'A cash crop processed into sugar and related products.'],
  ['Tobacco', 8.4, 'A commercial leaf crop requiring careful field management.'],
  ['Barley', 210, 'A hardy cereal used for food, malt, and livestock feed.'],
  ['Potato', 260, 'A versatile vegetable crop for fresh markets and processing.'],
  ['Tomato', 310, 'A popular vegetable crop with strong fresh-market demand.'],
  ['Onion', 225, 'A widely traded bulb crop used in everyday cooking.'],
  ['Garlic', 480, 'An aromatic bulb crop valued for food and health uses.'],
  ['Carrot', 180, 'A cool-season root vegetable rich in nutrients.'],
  ['Cabbage', 145, 'A leafy vegetable suited to cool growing conditions.'],
  ['Spinach', 120, 'A fast-growing leafy vegetable for fresh consumption.'],
  ['Apple', 760, 'A fruit crop grown in cooler highland regions.'],
  ['Mango', 690, 'A premium Pakistani fruit with strong local and export demand.'],
  ['Banana', 340, 'A tropical fruit crop harvested throughout the year.'],
  ['Orange', 420, 'A citrus fruit crop valued for fresh fruit and juice.'],
  ['Guava', 300, 'A hardy fruit crop popular in local fresh markets.'],
  ['Grapes', 620, 'A high-value fruit crop used fresh and for processing.'],
  ['Watermelon', 230, 'A warm-season fruit crop with high summer demand.'],
  ['Fertilizers', 125, 'Nutrients that support crop growth and soil fertility.'],
  ['Seeds', 95, 'Quality planting material selected for reliable crop production.'],
  ['Pesticides', 75, 'Crop protection products used against pests and diseases.'],
  ['Farming Tools', 35, 'Essential hand tools for planting, care, and harvest.'],
  ['Drip Irrigation Kits', 180, 'Water-saving irrigation systems for efficient crop production.'],
  ['Garden Hoses', 28, 'Flexible watering equipment for farms and gardens.'],
  ['Agricultural Equipment', 950, 'Farm machinery and equipment for larger field operations.']
].map(([name, fallback, details]) => ({
  name,
  key: `REFERENCE_${name.toUpperCase().replace(/\s+/g, '_')}`,
  unit: 'PKR reference market price',
  fallback,
  price: fallback,
  details,
  live: false,
  date: 'Reference price'
}))

export default function MarketPrices() {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')

  async function loadPrices() {
    setLoading(true)
    setPrices([...commodities.map((commodity) => ({ ...commodity, price: commodity.fallback, date: 'Pakistani market reference', live: false })), ...additionalProducts])
    setLoading(false)
  }

  useEffect(() => {
    loadPrices()
  }, [])

  const visiblePrices = prices.filter((item) => {
    const searchText = `${item.name} ${item.details} ${item.unit}`.toLowerCase()
    return searchText.includes(query.trim().toLowerCase())
  })

  return (
    <section className="market-page">
      <div className="market-heading">
        <div>
          <p className="section-kicker">AgroMart market desk</p>
          <h1>Market Prices</h1>
          <p>Latest commodity prices converted to Pakistani rupees for agricultural planning.</p>
        </div>
        <button type="button" className="location-btn" onClick={loadPrices} disabled={loading}>
          {loading ? 'Updating...' : 'Refresh prices'}
        </button>
      </div>

      {error && <div className="market-notice">{error}</div>}
      {loading && !prices.length && <div className="weather-status">Loading market prices...</div>}
      <form className="market-search" onSubmit={(event) => { event.preventDefault(); setQuery(searchTerm) }}>
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search crop or product, e.g. wheat" aria-label="Search market crop or product" />
        <button type="submit">Search</button>
        <button type="button" className="market-clear" onClick={() => { setSearchTerm(''); setQuery('') }} disabled={!searchTerm && !query}>Clear</button>
      </form>
      <div className="market-grid">
        {visiblePrices.map((item) => (
          <article className="market-card" key={item.key}>
            <div className="market-card-body">
              <div className="market-card-top">
                <span className="market-icon" aria-hidden="true">{item.name.charAt(0)}</span>
                <span className={item.live ? 'live-badge' : 'reference-badge'}>{item.live ? 'Live' : 'Reference'}</span>
              </div>
              <h2>{item.name}</h2>
              <strong className="market-price">PKR {Number(item.price ?? item.fallback).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</strong>
              <span className="market-unit">{item.unit}</span>
              <p className="market-details">{item.details}</p>
              <small>Updated: {item.date}</small>
            </div>
          </article>
        ))}
      </div>
      {!loading && !visiblePrices.length && <p className="market-empty">No crop or product found for “{query}”.</p>}
      <p className="market-source">Prices are Pakistani market reference values. Local mandi rates may differ by city, quality, and season.</p>
    </section>
  )
}