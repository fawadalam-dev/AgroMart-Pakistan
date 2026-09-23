import React, { useEffect, useMemo, useState } from 'react'
import ProductReviews from '../components/ProductReviews'
import ProductFavorite from '../components/ProductFavorite'
import ProductDetails from '../components/ProductDetails'
import { belongsToSection } from '../utils/productSections'

function loadSeeds() {
    try {
        const products = JSON.parse(localStorage.getItem('agro_products') || '[]')
        return Array.isArray(products) ? products.filter((product) => product.status === 'approved' && belongsToSection(product, 'seeds')) : []
    } catch {
        return []
    }
}

export default function Seeds() {
    const [products, setProducts] = useState(loadSeeds)
    const [query, setQuery] = useState('')
    const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
    const [notice, setNotice] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)

    useEffect(() => {
        try { const savedCart = JSON.parse(localStorage.getItem('agro_cart') || 'null'); if (savedCart) setCart(savedCart) } catch { }
        const refresh = () => setProducts(loadSeeds())
        window.addEventListener('agro-products-updated', refresh)
        return () => window.removeEventListener('agro-products-updated', refresh)
    }, [])

    const visibleProducts = useMemo(() => products.filter((product) => !query.trim() || product.name.toLowerCase().includes(query.toLowerCase())), [products, query])

    useEffect(() => {
        const cards = document.querySelectorAll('.crops-catalog-page .agri-product-card')
        const handlers = [...cards].map((card, index) => {
            const open = (event) => {
                if (event.target.closest('button, a, input, textarea, select')) return
                setSelectedProduct(visibleProducts[index])
            }
            card.addEventListener('click', open)
            return [card, open]
        })
        return () => handlers.forEach(([card, open]) => card.removeEventListener('click', open))
    }, [visibleProducts])

    function addToCart(product) {
        if (Number(product.stock) === 0) { setNotice(`${product.name} is currently out of stock`); return }
        const next = { items: { ...cart.items, [product.id]: (cart.items[product.id] || 0) + 1 }, count: cart.count + 1, total: cart.total + Number(product.price) }
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
        <div className="agri-shop-hero crops-shop-hero"><div><p className="hero-eyebrow">AgroMart seed collection</p><h1>Better seeds.<br /><em>Stronger harvests.</em></h1><p>Find every seed variety added and managed by the Super Admin for Pakistan's farms and gardens.</p><button type="button" onClick={() => document.querySelector('.agri-catalog')?.scrollIntoView({ behavior: 'smooth' })}>Explore seeds <span>↓</span></button></div><div className="agri-hero-stamp"><strong>100%</strong><span>Admin<br />managed</span></div></div>
        <div className="agri-shop-toolbar"><div><p className="section-kicker">From the seed bank</p><h2>Shop seeds</h2></div><div className="agri-cart-link"><span>{cart.count} items</span><strong>Rs {cart.total.toLocaleString()}</strong><button type="button" onClick={clearCart} disabled={!cart.count}>Clear</button><a href="#/order" aria-label="Open shopping cart">Cart →</a></div></div>
        <div className="agri-shop-controls"><div className="agri-category-tabs"><button type="button" className="active">All seeds</button></div><label className="agri-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search seeds..." /></label></div>
        {notice && <div className="shop-notice" role="status">✓ {notice}</div>}
        <div className="agri-catalog"><div className="agri-catalog-heading"><p>{visibleProducts.length} seed products</p><span>Managed across the whole website</span></div><div className="agri-product-grid">{visibleProducts.map((product) => <article className="agri-product-card" key={product.id}><div className="agri-product-image"><img src={product.image} alt={product.name} loading="lazy" /><span>Seed variety</span><ProductFavorite productId={product.id} productName={product.name} /></div><div className="agri-product-info"><p className="agri-product-category">Seeds</p><h3>{product.name}</h3><div className="agri-rating"><strong>★ {product.rating || '4.8'}</strong><span>({product.reviews || 0})</span></div><span className={`stock-status ${product.stock === 0 ? 'out-of-stock' : ''}`}>{product.stock === 0 ? 'Out of stock' : 'In stock'}</span><div className="agri-product-footer"><strong>Rs {Number(product.price).toLocaleString()}</strong><button type="button" onClick={() => addToCart(product)} disabled={product.stock === 0} aria-label={`Add ${product.name} to cart`}>+</button></div><ProductReviews productId={product.id} /></div></article>)}</div>{!visibleProducts.length && <p className="empty-results">No seed products are available yet. Super Admin can add them from the dashboard.</p>}</div>
        {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />}
    </section>
}
