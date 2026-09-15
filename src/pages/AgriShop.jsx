import React, { useEffect, useMemo, useState } from 'react'

const shopProducts = [
    { id: 'shop-spray-pump', name: '16L Pressure Spray Pump', category: 'Crop Care', price: 4850, badge: 'Best seller', rating: '4.9', reviews: 126, image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=700&auto=format&fit=crop' },
    { id: 'shop-gloves', name: 'All-Weather Garden Gloves', category: 'Safety Gear', price: 1250, badge: 'Farmer pick', rating: '4.8', reviews: 84, image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=700&auto=format&fit=crop' },
    { id: 'shop-mask', name: 'Agriculture Safety Mask', category: 'Safety Gear', price: 980, badge: 'New', rating: '4.7', reviews: 53, image: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?q=80&w=700&auto=format&fit=crop' },
    { id: 'shop-gamla', name: 'Heavy Duty Garden Gamla', category: 'Garden Tools', price: 1650, badge: 'Popular', rating: '4.8', reviews: 91, image: 'https://images.unsplash.com/photo-1599685315640-4f5f6f1c2d7a?q=80&w=700&auto=format&fit=crop' },
    { id: 'shop-pruner', name: 'Professional Plant Pruner', category: 'Garden Tools', price: 2200, badge: 'Pro choice', rating: '4.9', reviews: 72, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=700&auto=format&fit=crop' },
    { id: 'shop-hose', name: '25m Flexible Water Hose', category: 'Irrigation', price: 6950, badge: 'Top rated', rating: '4.8', reviews: 118, image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=700&auto=format&fit=crop' },
    { id: 'shop-seeder', name: 'Handheld Seed Planter', category: 'Farm Tools', price: 3750, badge: 'Smart tool', rating: '4.6', reviews: 47, image: 'https://images.unsplash.com/photo-1592982537447-6f8a4b7d4d6a?q=80&w=700&auto=format&fit=crop' },
    { id: 'shop-pot', name: 'Terracotta Planter Set', category: 'Garden Tools', price: 2850, badge: 'For home farms', rating: '4.7', reviews: 66, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=700&auto=format&fit=crop' }
]

function readStoredProducts() {
    try { return JSON.parse(localStorage.getItem('agro_products') || '[]') } catch { return [] }
}

export default function AgriShop() {
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState('All products')
    const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
    const [notice, setNotice] = useState('')

    useEffect(() => {
        const currentProducts = readStoredProducts()
        const savedIds = new Set(currentProducts.map((product) => product.id))
        const missing = shopProducts.filter((product) => !savedIds.has(product.id))
        if (missing.length) localStorage.setItem('agro_products', JSON.stringify([...currentProducts, ...missing]))
        try { const savedCart = JSON.parse(localStorage.getItem('agro_cart') || 'null'); if (savedCart) setCart(savedCart) } catch { }
    }, [])

    const approvedVendorProducts = readStoredProducts().filter((product) => product.id?.startsWith('seller-') && product.status === 'approved')
    const products = [...shopProducts, ...approvedVendorProducts]
    const categories = ['All products', ...new Set(products.map((product) => product.category))]
    const visibleProducts = useMemo(() => products.filter((product) => {
        const matchesCategory = category === 'All products' || product.category === category
        const matchesQuery = !query.trim() || `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())
        return matchesCategory && matchesQuery
    }), [category, query, products.length])

    function addToCart(product) {
        const items = { ...cart.items, [product.id]: (cart.items[product.id] || 0) + 1 }
        const next = { items, count: cart.count + 1, total: cart.total + Number(product.price) }
        setCart(next)
        localStorage.setItem('agro_cart', JSON.stringify(next))
        window.dispatchEvent(new Event('agro-cart-updated'))
        setNotice(`${product.name} added to cart`)
        window.setTimeout(() => setNotice(''), 2200)
    }

    return <section className="agri-shop-page">
        <div className="agri-shop-hero"><div><p className="hero-eyebrow">AgroMart essentials</p><h1>Tools that grow<br /><em>better harvests.</em></h1><p>Trusted equipment and everyday supplies for farms, gardens, and the people who care for them.</p><button type="button" onClick={() => document.querySelector('.agri-catalog')?.scrollIntoView({ behavior: 'smooth' })}>Explore collection <span>↓</span></button></div><div className="agri-hero-stamp"><strong>100%</strong><span>Farm-ready<br />quality</span></div></div>
        <div className="agri-shop-toolbar"><div><p className="section-kicker">Curated for you</p><h2>Agri Shop</h2></div><div className="agri-cart-link"><span>{cart.count} items</span><strong>Rs {cart.total.toLocaleString()}</strong><a href="#/order" aria-label="Open shopping cart">Cart →</a></div></div>
        <div className="agri-shop-controls"><div className="agri-category-tabs">{categories.map((item) => <button key={item} type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="agri-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools, supplies..." /></label></div>
        {notice && <div className="shop-notice" role="status">✓ {notice}</div>}
        <div className="agri-catalog"><div className="agri-catalog-heading"><p>{visibleProducts.length} products</p><span>Free delivery on orders over Rs 10,000</span></div><div className="agri-product-grid">{visibleProducts.map((product) => <article className="agri-product-card" key={product.id}><div className="agri-product-image"><img src={product.image} alt={product.name} loading="lazy" /><span>{product.badge || 'Vendor product'}</span><button type="button" aria-label={`Add ${product.name} to wishlist`}>♡</button></div><div className="agri-product-info"><p className="agri-product-category">{product.category}</p><h3>{product.name}</h3><div className="agri-rating"><strong>★ {product.rating || '4.8'}</strong><span>({product.reviews || 0})</span></div><div className="agri-product-footer"><strong>Rs {Number(product.price).toLocaleString()}</strong><button type="button" onClick={() => addToCart(product)} aria-label={`Add ${product.name} to cart`}>+</button></div></div></article>)}</div>{!visibleProducts.length && <p className="empty-results">No products match your search.</p>}</div>
    </section>
}