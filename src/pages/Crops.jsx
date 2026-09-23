import React, { useEffect, useMemo, useState } from 'react'
import ProductReviews from '../components/ProductReviews'
import ProductFavorite from '../components/ProductFavorite'
import ProductDetails from '../components/ProductDetails'
import { belongsToSection } from '../utils/productSections'

function loadProducts() {
    try {
        const stored = JSON.parse(localStorage.getItem('agro_products') || '[]')
        if (!Array.isArray(stored)) return []
        return stored.filter((product) => product.status === 'approved' && belongsToSection(product, 'crops'))
    } catch {
        return []
    }
}

export default function Crops() {
    const [products, setProducts] = useState(loadProducts)
    const [category, setCategory] = useState('All crops')
    const [query, setQuery] = useState('')
    const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
    const [notice, setNotice] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)

    useEffect(() => {
        try { const savedCart = JSON.parse(localStorage.getItem('agro_cart') || 'null'); if (savedCart) setCart(savedCart) } catch { }
        const refreshProducts = () => setProducts(loadProducts())
        window.addEventListener('agro-products-updated', refreshProducts)
        return () => window.removeEventListener('agro-products-updated', refreshProducts)
    }, [])

    const categories = ['All crops', ...new Set(products.map((product) => product.category))]
    const visibleProducts = useMemo(() => products.filter((product) => {
        const matchesCategory = category === 'All crops' || product.category === category
        const matchesQuery = !query.trim() || `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())
        return matchesCategory && matchesQuery
    }), [products, category, query])

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
        <div className="agri-catalog"><div className="agri-catalog-heading"><p>{visibleProducts.length} products</p><span>Fresh selections for every growing season</span></div><div className="agri-product-grid">{visibleProducts.map((product) => <article className="agri-product-card" key={product.id} onClick={() => setSelectedProduct(product)} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') setSelectedProduct(product) }}><div className="agri-product-image"><img src={product.image} alt={product.name} loading="lazy" /><span>{product.category === 'Major Crops' ? 'Field essential' : 'Fresh pick'}</span><ProductFavorite productId={product.id} productName={product.name} /></div><div className="agri-product-info"><p className="agri-product-category">{product.category}</p><h3>{product.name}</h3><div className="agri-rating"><strong>★ {product.rating || '4.8'}</strong><span>({product.reviews || 0})</span></div><span className={`stock-status ${product.stock === 0 ? 'out-of-stock' : ''}`}>{product.stock === 0 ? 'Out of stock' : 'In stock'}</span><div className="agri-product-footer"><strong>Rs {Number(product.price).toLocaleString()}</strong><button type="button" onClick={(event) => { event.stopPropagation(); addToCart(product) }} disabled={product.stock === 0} aria-label={`Add ${product.name} to cart`}>+</button></div><ProductReviews productId={product.id} /></div></article>)}</div>{!visibleProducts.length && <p className="empty-results">No crops match your search.</p>}</div>{selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />}
        {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />}
    </section>
}
