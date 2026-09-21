import React, { useEffect, useMemo, useState } from 'react'

const CATEGORIES = {
    'Major Crops': ['Wheat', 'Rice', 'Maize', 'Sugarcane', 'Cotton', 'Tobacco', 'Barley'],
    Vegetables: ['Potato', 'Tomato', 'Onion', 'Garlic', 'Carrot', 'Cabbage', 'Spinach'],
    Fruits: ['Apple', 'Mango', 'Banana', 'Orange', 'Guava', 'Grapes', 'Watermelon'],
    'More Products': ['Fertilizers', 'Seeds', 'Pesticides', 'Farming Tools', 'Drip Irrigation Kits', 'Garden Hoses', 'Agricultural Equipment']
}

function priceFor(name) {
    const sum = Array.from(name).reduce((total, character) => total + character.charCodeAt(0), 0)
    return (sum % 500) + 100
}

function defaultProducts() {
    return Object.entries(CATEGORIES).flatMap(([category, names]) => names.map((name) => ({
        id: `${category}-${name}`, name, category, price: priceFor(name), rating: '4.8', reviews: 42,
        image: `https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=700&auto=format&fit=crop&sig=${encodeURIComponent(name)}`
    })))
}

function loadProducts() {
    const defaults = defaultProducts()
    const defaultIds = new Set(defaults.map((product) => product.id))
    try {
        const stored = JSON.parse(localStorage.getItem('agro_products') || '[]')
        if (!Array.isArray(stored)) return defaults
        const savedDefaults = new Map(stored.filter((product) => defaultIds.has(product.id)).map((product) => [product.id, product]))
        const approvedVendorProducts = stored.filter((product) => product.id?.startsWith('seller-') && product.status === 'approved')
        const approvedAdminProducts = stored.filter((product) => product.status === 'approved' && !product.id?.startsWith('seller-') && !defaultIds.has(product.id))
        return [...defaults.map((product) => savedDefaults.get(product.id) || product), ...approvedVendorProducts, ...approvedAdminProducts]
    } catch {
        return defaults
    }
}

export default function Crops() {
    const [products, setProducts] = useState(loadProducts)
    const [category, setCategory] = useState('All crops')
    const [query, setQuery] = useState('')
    const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
    const [notice, setNotice] = useState('')

    useEffect(() => {
        try { const savedCart = JSON.parse(localStorage.getItem('agro_cart') || 'null'); if (savedCart) setCart(savedCart) } catch { }
        const refreshProducts = () => setProducts(loadProducts())
        window.addEventListener('agro-products-updated', refreshProducts)
        return () => window.removeEventListener('agro-products-updated', refreshProducts)
    }, [])

    const categories = ['All crops', ...Object.keys(CATEGORIES), ...new Set(products.map((product) => product.category).filter((item) => !Object.keys(CATEGORIES).includes(item)))]
    const visibleProducts = useMemo(() => products.filter((product) => {
        const matchesCategory = category === 'All crops' || product.category === category
        const matchesQuery = !query.trim() || `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())
        return matchesCategory && matchesQuery
    }), [products, category, query])

    function addToCart(product) {
        if (Number(product.stock) === 0) { setNotice(`${product.name} is currently out of stock`); return }
        const items = { ...cart.items, [product.id]: (cart.items[product.id] || 0) + 1 }
        const next = { items, count: cart.count + 1, total: cart.total + Number(product.price) }
        setCart(next)
        localStorage.setItem('agro_cart', JSON.stringify(next))
        window.dispatchEvent(new Event('agro-cart-updated'))
        setNotice(`${product.name} added to cart`)
        window.setTimeout(() => setNotice(''), 2200)
    }

    function clearCart() {
        const emptyCart = { items: {}, count: 0, total: 0 }
        setCart(emptyCart)
        localStorage.setItem('agro_cart', JSON.stringify(emptyCart))
        window.dispatchEvent(new Event('agro-cart-updated'))
    }

    return <section className="agri-shop-page crops-catalog-page">
        <div className="agri-shop-hero crops-shop-hero"><div><p className="hero-eyebrow">AgroMart crop collection</p><h1>Grow more.<br /><em>Harvest better.</em></h1><p>Healthy seeds, trusted crops, and farm essentials selected for Pakistan's fields and gardens.</p><button type="button" onClick={() => document.querySelector('.agri-catalog')?.scrollIntoView({ behavior: 'smooth' })}>Explore crops <span>↓</span></button></div><div className="agri-hero-stamp"><strong>4+</strong><span>Crop<br />collections</span></div></div>
        <div className="agri-shop-toolbar"><div><p className="section-kicker">From the field</p><h2>Shop crops</h2></div><div className="agri-cart-link"><span>{cart.count} items</span><strong>Rs {cart.total.toLocaleString()}</strong><button type="button" onClick={clearCart} disabled={!cart.count}>Clear</button><a href="#/order" aria-label="Open shopping cart">Cart →</a></div></div>
        <div className="agri-shop-controls"><div className="agri-category-tabs">{categories.map((item) => <button key={item} type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="agri-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search crops, fruits, vegetables..." /></label></div>
        {notice && <div className="shop-notice" role="status">✓ {notice}</div>}
        <div className="agri-catalog"><div className="agri-catalog-heading"><p>{visibleProducts.length} products</p><span>Fresh selections for every growing season</span></div><div className="agri-product-grid">{visibleProducts.map((product) => <article className="agri-product-card" key={product.id}><div className="agri-product-image"><img src={product.image} alt={product.name} loading="lazy" /><span>{product.id.startsWith('seller-') ? 'Approved vendor' : product.category === 'Major Crops' ? 'Field essential' : 'Fresh pick'}</span><button type="button" aria-label={`Add ${product.name} to wishlist`}>♡</button></div><div className="agri-product-info"><p className="agri-product-category">{product.category}</p><h3>{product.name}</h3><div className="agri-rating"><strong>★ {product.rating || '4.8'}</strong><span>({product.reviews || 0})</span></div><span className={`stock-status ${product.stock === 0 ? 'out-of-stock' : ''}`}>{product.stock === 0 ? 'Out of stock' : 'In stock'}</span><div className="agri-product-footer"><strong>Rs {Number(product.price).toLocaleString()}</strong><button type="button" onClick={() => addToCart(product)} disabled={product.stock === 0} aria-label={`Add ${product.name} to cart`}>+</button></div></div></article>)}</div>{!visibleProducts.length && <p className="empty-results">No crops match your search.</p>}</div>
    </section>
}
