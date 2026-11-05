import React, { useEffect, useMemo, useState } from 'react'
import ProductDetails, { ProductFavorite, ProductReviews } from '../components/ProductDetails'
import { belongsToSection } from '../utils/productSections'
import { fetchProducts } from '../utils/api'

const catalogSections = [
    { id: 'all', label: 'All products' },
    { id: 'crops', label: 'Crop products' },
    { id: 'seeds', label: 'Seeds' },
    { id: 'fertilizers', label: 'Fertilizers' },
    { id: 'medicine', label: 'Medicine & treatment' },
    { id: 'agriShop', label: 'Tools & supplies' }
]
export default function AgriShop({ initialSection = 'all' }) {
    const [query, setQuery] = useState('')
    const [section, setSection] = useState(initialSection)
    const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
    const [notice, setNotice] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [products, setProducts] = useState([])

    useEffect(() => {
        try { const savedCart = JSON.parse(localStorage.getItem('agro_cart') || 'null'); if (savedCart) setCart(savedCart) } catch { }
        const refreshCart = () => { try { setCart(JSON.parse(localStorage.getItem('agro_cart') || '{"items":{},"count":0,"total":0}')) } catch { } }
        let isCurrent = true
        let isRefreshing = false
        const refreshProducts = async () => {
            if (isRefreshing) return
            isRefreshing = true
            try {
                const serverProducts = await fetchProducts()
                if (!isCurrent) return
                const names = new Set()
                const visible = serverProducts.filter((product) => {
                    const name = product.name.trim().toLowerCase()
                    if (names.has(name)) return false
                    names.add(name)
                    return true
                })
                setProducts(visible)
                setSelectedProduct((current) => current && !visible.some((product) => product.id === current.id) ? null : current)
                setNotice((current) => current.startsWith('Online products could not be loaded:') ? '' : current)
            } catch (error) {
                if (isCurrent) {
                    setNotice(`Online products could not be loaded: ${error.message}`)
                }
            } finally {
                isRefreshing = false
            }
        }
        refreshProducts()
        const productInterval = window.setInterval(refreshProducts, 15000)
        const refreshWhenVisible = () => {
            if (!document.hidden) refreshProducts()
        }
        window.addEventListener('focus', refreshWhenVisible)
        document.addEventListener('visibilitychange', refreshWhenVisible)
        window.addEventListener('agro-products-updated', refreshProducts)
        window.addEventListener('agro-cart-updated', refreshCart)
        return () => {
            isCurrent = false
            window.clearInterval(productInterval)
            window.removeEventListener('focus', refreshWhenVisible)
            document.removeEventListener('visibilitychange', refreshWhenVisible)
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
    const sectionTitle = section === 'all'
        ? 'All Products'
        : catalogSections.find((item) => item.id === section)?.label || 'All Products'

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
        <div className="agri-shop-toolbar"><div><p className="section-kicker">One farm marketplace</p><h2>{sectionTitle}</h2></div><div className="agri-cart-link"><span>{cart.count} items</span><strong>Rs {cart.total.toLocaleString()}</strong><button type="button" onClick={clearCart} disabled={!cart.count}>Clear</button><a href="#/order" aria-label="Open shopping cart">Cart →</a></div></div>
        <div className="agri-shop-controls unified-catalog-controls"><div className="agri-category-tabs" role="tablist" aria-label="Product categories">{catalogSections.map((item) => <button key={item.id} type="button" role="tab" aria-selected={section === item.id} className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>{item.label}</button>)}</div><label className="agri-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search seeds, crops, tools, treatments..." /></label></div>
        {notice && <div className="shop-notice" role="status">✓ {notice}</div>}
        <div className="agri-catalog"><div className="agri-catalog-heading"><p>{visibleProducts.length} products</p><span>Free delivery on orders over Rs 10,000</span></div><div className="agri-product-grid">{visibleProducts.map((product) => <article className="agri-product-card" key={product.id} onClick={() => setSelectedProduct(product)} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') setSelectedProduct(product) }}><div className="agri-product-image"><img src={product.image} alt={product.name} loading="lazy" /><span>{product.badge || product.category || 'AgroMart product'}</span><ProductFavorite productId={product.id} productName={product.name} /></div><div className="agri-product-info"><p className="agri-product-category">{product.category}</p><h3>{product.name}</h3><div className="agri-rating"><strong>★ {product.rating || '4.8'}</strong><span>({product.reviews || 0})</span></div><span className={`stock-status ${product.stock === 0 ? 'out-of-stock' : ''}`}>{product.stock === 0 ? 'Out of stock' : 'In stock'}</span><div className="agri-product-footer"><strong>Rs {Number(product.price).toLocaleString()}</strong><button type="button" onClick={(event) => { event.stopPropagation(); addToCart(product) }} disabled={product.stock === 0} aria-label={`Add ${product.name} to cart`}>+</button></div><ProductReviews productId={product.id} /></div></article>)}</div>{!visibleProducts.length && <p className="empty-results">No products match this category or search.</p>}</div>{selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />}
    </section>
}