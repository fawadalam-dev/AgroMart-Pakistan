import React, { useEffect, useMemo, useState } from 'react'
import Assistant from './Assistant'
import ProductReviews from '../components/ProductReviews'
import ProductFavorite from '../components/ProductFavorite'
import ProductDetails from '../components/ProductDetails'
import { belongsToSection } from '../utils/productSections'

const starterMedicines = [
    {
        id: 'med-strength',
        name: 'Energy & Strength Tonic',
        category: 'Strength medicines',
        price: 850,
        stock: 24,
        status: 'approved',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=720&q=82',
        details: 'A plant-strength product listing for the medicine section. Check the product label and suitability for your crop before use.',
        usage: 'Follow the product label and seek advice from a qualified agriculture officer if unsure.'
    },
    {
        id: 'med-crop-disease',
        name: 'Crop Disease Care Pack',
        category: 'Crop medicines',
        price: 1450,
        stock: 18,
        status: 'approved',
        image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=720&q=82',
        details: 'A crop-care product listing for common treatment needs. Identify the issue before selecting a treatment.',
        usage: 'Use only according to the product label. Confirm disease and treatment with a qualified agriculture officer.'
    }
]

function loadProducts() {
    try {
        const products = JSON.parse(localStorage.getItem('agro_products') || '[]')
        const approved = Array.isArray(products) ? products.filter((product) => product.status === 'approved' && belongsToSection(product, 'medicine')) : []
        return approved.length ? approved : starterMedicines
    } catch { return starterMedicines }
}

export default function Medicine() {
    const [category, setCategory] = useState('All')
    const [query, setQuery] = useState('')
    const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('agro_cart') || '{"items":{},"count":0,"total":0}') } catch { return { items: {}, count: 0, total: 0 } } })
    const [notice, setNotice] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [products, setProducts] = useState(loadProducts)
    const visible = useMemo(() => products.filter((product) => (category === 'All' || product.category === category) && (!query.trim() || `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase()))), [products, category, query])

    useEffect(() => {
        const cards = document.querySelectorAll('.medicine-page .agri-product-card')
        const handlers = [...cards].map((card, index) => {
            const open = (event) => {
                if (event.target.closest('button, a, input, textarea, select')) return
                setSelectedProduct(visible[index])
            }
            card.addEventListener('click', open)
            return [card, open]
        })
        return () => handlers.forEach(([card, open]) => card.removeEventListener('click', open))
    }, [visible])
    function clearCart() {
        const emptyCart = { items: {}, count: 0, total: 0 }
        setCart(emptyCart)
        localStorage.setItem('agro_cart', JSON.stringify(emptyCart))
        window.dispatchEvent(new Event('agro-cart-updated'))
    }
    useEffect(() => {
        const refreshProducts = () => setProducts(loadProducts())
        window.addEventListener('agro-products-updated', refreshProducts)
        const refreshCart = () => { try { setCart(JSON.parse(localStorage.getItem('agro_cart') || '{"items":{},"count":0,"total":0}')) } catch {} }
        window.addEventListener('agro-cart-updated', refreshCart)
        return () => { window.removeEventListener('agro-products-updated', refreshProducts); window.removeEventListener('agro-cart-updated', refreshCart) }
    }, [])
    function addToCart(product) {
        const next = { items: { ...cart.items, [product.id]: (cart.items[product.id] || 0) + 1 }, count: cart.count + 1, total: cart.total + product.price }
        setCart(next); localStorage.setItem('agro_cart', JSON.stringify(next)); window.dispatchEvent(new Event('agro-cart-updated'))
        setNotice(`${product.name} added to cart`)
        window.setTimeout(() => setNotice(''), 2200)
    }
    return <section className="medicine-page">
        <div className="medicine-hero"><div><p className="hero-eyebrow">AgroMart crop care</p><h1>Healthy crops.<br /><em>Stronger harvests.</em></h1><p>Find crop treatments, plant strength products, and soil nutrition for every growing season.</p><a href="#medicine-products">Browse treatments <span aria-hidden="true">↓</span></a></div><img className="medicine-hero-image" src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=84" alt="Gardener tending healthy plants" /></div>
        <div className="medicine-care-strip" aria-label="Crop care services">
            <a href="#/assistant"><span className="medicine-care-icon">✦</span><span><strong>Identify a crop issue</strong><small>Get guided first steps for plant symptoms.</small></span><b aria-hidden="true">→</b></a>
            <a href="#medicine-products"><span className="medicine-care-icon">＋</span><span><strong>Browse treatments</strong><small>Search crop medicine and treatment products.</small></span><b aria-hidden="true">→</b></a>
            <a href="#/prices"><span className="medicine-care-icon">▥</span><span><strong>Plan your season</strong><small>Check local market reference prices.</small></span><b aria-hidden="true">→</b></a>
        </div>
        <div className="medicine-cart-bar"><span>{cart.count} item{cart.count === 1 ? '' : 's'} in cart</span><strong>Rs {cart.total.toLocaleString()}</strong><button type="button" onClick={clearCart} disabled={!cart.count}>Clear</button><a href="#/order">View cart and checkout →</a></div>
        {notice && <div className="shop-notice" role="status">✓ {notice}</div>}
        <div className="medicine-layout" id="medicine-products"><div><div className="agri-shop-controls medicine-controls"><div className="agri-category-tabs medicine-tabs">{['All', 'Crop medicines', 'Strength medicines', 'Fertilizer'].map((item) => <button type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><label className="agri-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicines, fertilizers..." /></label></div>{!visible.length && <div className="medicine-empty-state"><img src="https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=700&q=82" alt="Healthy green plant" /><div><strong>No matching treatments</strong><span>Try another category or search term, or ask the Farmer Assistant for guidance.</span></div></div>}<div className="agri-product-grid">{visible.map((product) => <article className="agri-product-card" key={product.id} onClick={() => setSelectedProduct(product)} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') setSelectedProduct(product) }}><div className="agri-product-image"><img src={product.image} alt={product.name} loading="lazy" /><ProductFavorite productId={product.id} productName={product.name} /></div><div className="agri-product-info"><p className="agri-product-category">{product.category}</p><h3>{product.name}</h3><span className="stock-status">{Number(product.stock) === 0 ? 'Out of stock' : 'In stock'}</span><div className="agri-product-footer"><strong>Rs {Number(product.price).toLocaleString()}</strong><button type="button" onClick={(event) => { event.stopPropagation(); addToCart(product) }} disabled={Number(product.stock) === 0} aria-label={`Add ${product.name} to cart`}>+</button></div><ProductReviews productId={product.id} /></div></article>)}</div></div><aside className="medicine-assistant"><Assistant /></aside></div>
        {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />}
    </section>
}
