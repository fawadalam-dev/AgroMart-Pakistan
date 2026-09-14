import React, { useEffect, useState } from 'react'

const commodities = [
  { name: 'Wheat', key: 'WHEAT', unit: 'USD / metric ton', fallback: 278, image: 'https://images.unsplash.com/photo-1500382017468-9049fed8d5f8?q=80&w=800&auto=format&fit=crop', details: 'A staple grain used for flour, bread, and livestock feed.' },
  { name: 'Corn', key: 'CORN', unit: 'USD / bushel', fallback: 4.42, image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=800&auto=format&fit=crop', details: 'A versatile crop used for food, animal feed, and biofuel.' },
  { name: 'Cotton', key: 'COTTON', unit: 'USD / pound', fallback: 0.82, image: 'https://images.unsplash.com/photo-1595475207225-428b62bda831?q=80&w=800&auto=format&fit=crop', details: 'A major fiber crop supporting textile and agricultural markets.' },
  { name: 'Sugar', key: 'SUGAR', unit: 'USD / pound', fallback: 0.21, image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?q=80&w=800&auto=format&fit=crop', details: 'Processed from sugarcane and sugar beet for food production.' },
  { name: 'Coffee', key: 'COFFEE', unit: 'USD / pound', fallback: 4.18, image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800&auto=format&fit=crop', details: 'A globally traded agricultural product sourced from coffee beans.' }
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
  unit: 'Reference market price',
  fallback,
  price: fallback,
  details,
  image: `https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=800&auto=format&fit=crop&sig=${encodeURIComponent(name)}`,
  live: false,
  date: 'Reference price'
}))

async function fetchCommodity(commodity) {
  const params = new URLSearchParams({ function: commodity.key, interval: 'monthly', apikey: 'demo' })
  const response = await fetch(`https://www.alphavantage.co/query?${params}`)
  if (!response.ok) throw new Error('Market API unavailable')
  const data = await response.json()
  const latest = data.data?.find((item) => item.value !== '.' && Number.isFinite(Number(item.value)))
  return {
    ...commodity,
    price: latest ? Number(latest.value) : commodity.fallback,
    date: latest?.date || 'Latest estimate',
    live: Boolean(latest)
  }
}

async function fetchUsdToPkrRate() {
  const response = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!response.ok) throw new Error('Exchange-rate API unavailable')
  const data = await response.json()
  if (!Number.isFinite(Number(data.rates?.PKR))) throw new Error('PKR exchange rate unavailable')
  return Number(data.rates.PKR)
}

export default function MarketPrices() {
  const [prices, setPrices] = useState([])
  const [usdToPkr, setUsdToPkr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')

  async function loadPrices() {
    setLoading(true)
    setError('')
    try {
      const [results, exchangeRate] = await Promise.all([
        Promise.all(commodities.map(fetchCommodity)),
        fetchUsdToPkrRate()
      ])
      setPrices([...results, ...additionalProducts])
      setUsdToPkr(exchangeRate)
    } catch (requestError) {
      setError('Live market or exchange-rate data is temporarily unavailable. USD prices are shown until the APIs respond.')
      try {
        const results = await Promise.all(commodities.map(fetchCommodity))
        setPrices([...results, ...additionalProducts])
      } catch (commodityError) {
        setPrices([...commodities.map((commodity) => ({ ...commodity, price: commodity.fallback, date: 'Reference price', live: false })), ...additionalProducts])
      }
      setUsdToPkr(null)
    } finally {
      setLoading(false)
    }
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
            <img className="market-card-image" src={item.image} alt={`${item.name} crop`} loading="lazy" />
            <div className="market-card-body">
              <div className="market-card-top">
                <span className="market-icon" aria-hidden="true">{item.name.charAt(0)}</span>
                <span className={item.live ? 'live-badge' : 'reference-badge'}>{item.live ? 'Live' : 'Reference'}</span>
              </div>
              <h2>{item.name}</h2>
              <strong className="market-price">{usdToPkr ? `PKR ${(Number(item.price ?? item.fallback) * usdToPkr).toLocaleString('en-PK', { maximumFractionDigits: 0 })}` : `USD $${Number(item.price ?? item.fallback).toLocaleString(undefined, { maximumFractionDigits: 3 })}`}</strong>
              <span className="market-unit">{usdToPkr ? `Live conversion: 1 USD = PKR ${usdToPkr.toFixed(2)}` : item.unit}</span>
              <p className="market-details">{item.details}</p>
              <small>Updated: {item.date}</small>
            </div>
          </article>
        ))}
      </div>
      {!loading && !visiblePrices.length && <p className="market-empty">No crop or product found for “{query}”.</p>}
      <p className="market-source">Source: Alpha Vantage commodity data and ExchangeRate-API. PKR amounts use the live USD/PKR exchange rate; local mandi rates may differ.</p>
    </section>
  )
}