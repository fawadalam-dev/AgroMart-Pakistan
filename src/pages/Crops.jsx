import React, { useRef, useState } from 'react'

// Simple Levenshtein distance for fuzzy match (small inputs only)
function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

const CATEGORIES = {
  'Major Crops': ['Wheat', 'Rice', 'Maize', 'Sugarcane', 'Cotton', 'Tobacco', 'Barley'],
  Vegetables: ['Potato', 'Tomato', 'Onion', 'Garlic', 'Carrot', 'Cabbage', 'Spinach'],
  Fruits: ['Apple', 'Mango', 'Banana', 'Orange', 'Guava', 'Grapes', 'Watermelon'],
  'More Products': ['Fertilizers', 'Seeds', 'Pesticides', 'Farming Tools', 'Drip Irrigation Kits', 'Garden Hoses', 'Agricultural Equipment']
}

function priceFor(name) {
  // deterministic pseudo-price based on name chars
  const sum = Array.from(name).reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return ((sum % 500) + 100)
}

function defaultProducts() {
  return Object.entries(CATEGORIES).flatMap(([category, names]) =>
    names.map((name) => ({
      id: `${category}-${name}`,
      name,
      category,
      price: priceFor(name),
      image: `https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=600&auto=format&fit=crop&sig=${encodeURIComponent(name)}`
    }))
  )
}

function ProductRow({ title, products, addToCart, removeProduct }) {
  const rowRef = useRef(null)
  const [canMove, setCanMove] = useState(false)

  function refreshControls() {
    const row = rowRef.current
    if (row) setCanMove(row.scrollWidth > row.clientWidth + 2)
  }

  function move(direction) {
    const row = rowRef.current
    if (!row) return
    const amount = Math.max(row.clientWidth / 3, 220)
    if (direction < 0 && row.scrollLeft <= 2) row.scrollLeft = row.scrollWidth - row.clientWidth
    else if (direction > 0 && row.scrollLeft + row.clientWidth >= row.scrollWidth - 2) row.scrollLeft = 0
    else row.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  React.useEffect(() => {
    refreshControls()
    const onResize = () => refreshControls()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [products.length])

  return (
    <section className="product-section" id={`category-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="section-heading">
        <div>
          <p className="section-kicker">Fresh from the field</p>
          <h2>{title}</h2>
        </div>
        <div className="row-controls">
          <button type="button" className="slider-btn" onClick={() => move(-1)} disabled={!canMove} aria-label={`Previous ${title}`}>&lsaquo;</button>
          <button type="button" className="slider-btn" onClick={() => move(1)} disabled={!canMove} aria-label={`Next ${title}`}>&rsaquo;</button>
        </div>
      </div>
      <div className="product-row" ref={rowRef} onScroll={refreshControls}>
        {products.map((product) => (
          <article className="crop-card" key={product.id}>
            <img src={product.image} alt={product.name} className="crop-card-img" loading="lazy" />
            <div className="crop-card-body">
              <h3>{product.name}</h3>
              <p className="price">Rs {product.price}</p>
              <div className="crop-card-actions">
                <button className="buy-btn" onClick={() => addToCart(product)}>Add to cart</button>
                <button type="button" className="remove-product-btn" onClick={() => removeProduct(product)} aria-label={`Remove ${product.name}`}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function loadProducts() {
  const defaults = defaultProducts()
  const defaultIds = new Set(defaults.map((product) => product.id))
  try {
    const raw = localStorage.getItem('agro_products')
    if (!raw) return defaults
    const stored = JSON.parse(raw)
    if (!Array.isArray(stored)) return defaults
    const storedDefaults = stored.filter((product) => defaultIds.has(product.id))
    const sellers = stored.filter((product) => product.id?.startsWith('seller-'))
    const savedById = new Map(storedDefaults.map((product) => [product.id, product]))
    return [...defaults.map((product) => savedById.get(product.id) || product), ...sellers]
  } catch (e) {
    return defaults
  }
}

export default function Crops() {
  const heroUrl = 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=2b2c7d5a9e6f6c9b0a3a1c6a8d2f7f8a'
  const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
  const [products, setProducts] = useState(loadProducts)
  // initialize cart from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('agro_cart')
      if (raw) setCart(JSON.parse(raw))
    } catch (e) { }
  }, [])

  // persist cart
  React.useEffect(() => {
    try { localStorage.setItem('agro_cart', JSON.stringify(cart)) } catch (e) { }
    window.dispatchEvent(new Event('agro-cart-updated'))
  }, [cart])

  React.useEffect(() => {
    try { localStorage.setItem('agro_products', JSON.stringify(products)) } catch (e) { }
  }, [products])

  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')
  function addToCart(product) {
    const price = Number(product.price)
    setCart((c) => {
      const nextItems = { ...c.items }
      nextItems[product.id] = (nextItems[product.id] || 0) + 1
      return { items: nextItems, count: c.count + 1, total: c.total + price }
    })
  }

  function removeProduct(product) {
    setProducts((items) => items.filter((item) => item.id !== product.id))
    setCart((currentCart) => {
      if (!currentCart.items[product.id]) return currentCart
      const nextItems = { ...currentCart.items }
      const quantity = nextItems[product.id]
      delete nextItems[product.id]
      return {
        items: nextItems,
        count: currentCart.count - quantity,
        total: currentCart.total - (Number(product.price) * quantity)
      }
    })
  }

  function clearCart() {
    setCart({ items: {}, count: 0, total: 0 })
  }

  // fuzzy filtering: include exact substrings or small-typo matches
  const filtered = React.useMemo(() => {
    const grouped = {}
    products.forEach((product) => {
      if (!grouped[product.category]) grouped[product.category] = []
      grouped[product.category].push(product)
    })
    if (!query.trim()) return grouped
    const q = query.trim().toLowerCase()
    const out = {}
    Object.entries(grouped).forEach(([section, items]) => {
      const matched = items.filter((product) => {
        const itL = product.name.toLowerCase()
        if (itL.includes(q)) return true
        // compare words in item name
        const parts = itL.split(/\s|\(|\)/).filter(Boolean)
        for (const p of parts) {
          const d = levenshtein(p, q)
          // allow small typos: threshold depends on token length
          if (d <= Math.max(1, Math.floor(p.length * 0.3))) return true
        }
        // also compare whole name
        const d2 = levenshtein(itL.replace(/\s+/g, ''), q.replace(/\s+/g, ''))
        if (d2 <= 2) return true
        return false
      })
      if (matched.length) out[section] = matched
    })
    return out
  }, [query])

  return (
    <section className="crops-page">
      <div className="crops-hero">
        <img src={heroUrl} alt="Farmer in field" className="crops-hero-img" />
        <div className="crops-hero-text">
          <p className="hero-eyebrow">AgroMart Pakistan</p>
          <h1>Good harvests start here.</h1>
          <p>Quality crops, farm supplies, and everyday growing essentials delivered to your door.</p>
        </div>
      </div>

      <div className="cart-summary">
        <div>Items: {cart.count}</div>
        <div>Total: Rs {cart.total}</div>
        <button className="clear-cart" onClick={clearCart} disabled={cart.count === 0}>Clear</button>
      </div>

      <div className="search-bar">
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search crops..." className="search-input" onKeyDown={(e) => { if (e.key === 'Enter') setQuery(searchTerm) }} />
        <button className="search-btn" onClick={() => setQuery(searchTerm)}>Search</button>
        <button className="clear-search" onClick={() => { setSearchTerm(''); setQuery('') }} disabled={!searchTerm && !query}>Clear</button>
      </div>

      <div className="crops-list">
        {Object.keys(CATEGORIES).map((section) => filtered[section]?.length > 0 && (
          <ProductRow key={section} title={section} products={filtered[section]} addToCart={addToCart} removeProduct={removeProduct} />
        ))}
        {!Object.keys(filtered).length && <p className="empty-results">No products match your search.</p>}
      </div>
    </section>
  )
}
