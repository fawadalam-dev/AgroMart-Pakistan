import React, { useEffect, useMemo, useState } from 'react'
import ProductDetails, { ProductFavorite, ProductReviews } from '../components/ProductDetails'
import { catalogProducts } from '../utils/catalogProducts'
import { belongsToSection } from '../utils/productSections'

const catalogSections = [
    { id: 'all', label: 'All products' },
    { id: 'crops', label: 'Crop products' },
    { id: 'seeds', label: 'Seeds' },
    { id: 'fertilizers', label: 'Fertilizers' },
    { id: 'medicine', label: 'Medicine & treatment' },
    { id: 'agriShop', label: 'Tools & supplies' }
]

function readStoredProducts() {
    try {
        const stored = JSON.parse(localStorage.getItem('agro_products') || '[]')
        return Array.isArray(stored) ? stored.filter((product) => product.status === 'approved') : []
    } catch { return [] }
}

function readCatalogProducts() {
    const storedProducts = readStoredProducts()
    const storedNames = new Set(storedProducts.map((product) => product.name.trim().toLowerCase()))
    return [
        ...storedProducts,
        ...catalogProducts.filter((product) => !storedNames.has(product.name.toLowerCase()))
    ]
}

export default function AgriShop({ initialSection = 'all' }) {
    const [query, setQuery] = useState('')
    const [section, setSection] = useState(initialSection)
    const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
    const [notice, setNotice] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [products, setProducts] = useState(readCatalogProducts)

    useEffect(() => {
        try { const savedCart = JSON.parse(localStorage.getItem('agro_cart') || 'null'); if (savedCart) setCart(savedCart) } catch { }
        const refreshProducts = () => setProducts(readCatalogProducts())
        const refreshCart = () => { try { setCart(JSON.parse(localStorage.getItem('agro_cart') || '{"items":{},"count":0,"total":0}')) } catch { } }
        window.addEventListener('agro-products-updated', refreshProducts)
        window.addEventListener('agro-cart-updated', refreshCart)
        return () => {
            window.removeEventListener('agro-products-updated', refreshProducts)
            window.removeEventListener('agro-cart-updated', refreshCart)
        }
    }, [])

    useEffect(() => setSection(initialSection), [initialSection])

    const visibleProducts = useMemo(() => products.filter((product) => {
        const matchesSection = section === 'all' || belongsToSection(product, section)
        const matchesQuery = !query.trim() || `${product.name} ${product.category} ${product.details || ''}`.toLowerCase().includes(query.toLowerCase())
        return matchesSection && matchesQuery
    }), [section, query, products])

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

    return <section className="agri-shop-page unified-catalog-page">
        <div className="agri-shop-hero"><div><p className="hero-eyebrow">AgroMart marketplace</p><h1>Everything your farm<br /><em>needs to grow.</em></h1><p>Seeds, crop inputs, treatments, tools, and farm supplies, gathered in one catalog.</p><button type="button" onClick={() => document.querySelector('.agri-catalog')?.scrollIntoView({ behavior: 'smooth' })}>Browse products <span>↓</span></button></div><div className="agri-hero-stamp"><strong>{products.length}</strong><span>Approved<br />products</span></div></div>
        <div className="agri-shop-toolbar"><div><p className="section-kicker">One farm marketplace</p><h2>All Products</h2></div><div className="agri-cart-link"><span>{cart.count} items</span><strong>Rs {cart.total.toLocaleString()}</strong><button type="button" onClick={clearCart} disabled={!cart.count}>Clear</button><a href="#/order" aria-label="Open shopping cart">Cart →</a></div></div>
        <div className="agri-shop-controls unified-catalog-controls"><div className="agri-category-tabs" role="tablist" aria-label="Product categories">{catalogSections.map((item) => <button key={item.id} type="button" role="tab" aria-selected={section === item.id} className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>{item.label}</button>)}</div><label className="agri-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search seeds, crops, tools, treatments..." /></label></div>
        {notice && <div className="shop-notice" role="status">✓ {notice}</div>}
        <div className="agri-catalog"><div className="agri-catalog-heading"><p>{visibleProducts.length} products</p><span>Free delivery on orders over Rs 10,000</span></div><div className="agri-product-grid">{visibleProducts.map((product) => <article className="agri-product-card" key={product.id} onClick={() => setSelectedProduct(product)} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') setSelectedProduct(product) }}><div className="agri-product-image"><img src={product.image} alt={product.name} loading="lazy" /><span>{product.badge || product.category || 'AgroMart product'}</span><ProductFavorite productId={product.id} productName={product.name} /></div><div className="agri-product-info"><p className="agri-product-category">{product.category}</p><h3>{product.name}</h3><div className="agri-rating"><strong>★ {product.rating || '4.8'}</strong><span>({product.reviews || 0})</span></div><span className={`stock-status ${product.stock === 0 ? 'out-of-stock' : ''}`}>{product.stock === 0 ? 'Out of stock' : 'In stock'}</span><div className="agri-product-footer"><strong>Rs {Number(product.price).toLocaleString()}</strong><button type="button" onClick={(event) => { event.stopPropagation(); addToCart(product) }} disabled={product.stock === 0} aria-label={`Add ${product.name} to cart`}>+</button></div><ProductReviews productId={product.id} /></div></article>)}</div>{!visibleProducts.length && <p className="empty-results">No products match this category or search.</p>}</div>{selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />}
    </section>
}