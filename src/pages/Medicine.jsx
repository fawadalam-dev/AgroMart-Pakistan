import React, { useEffect, useMemo, useState } from 'react'
import Assistant from './Assistant'
import ProductReviews from '../components/ProductReviews'
import ProductFavorite from '../components/ProductFavorite'
export default function Medicine() {
    const [category, setCategory] = useState('All')
    const [query, setQuery] = useState('')
    const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('agro_cart') || '{"items":{},"count":0,"total":0}') } catch { return { items: {}, count: 0, total: 0 } } })
    const [notice, setNotice] = useState('')
    const visible = []
    function clearCart() {
        const emptyCart = { items: {}, count: 0, total: 0 }
        setCart(emptyCart)
        localStorage.setItem('agro_cart', JSON.stringify(emptyCart))
        window.dispatchEvent(new Event('agro-cart-updated'))
    }
    useEffect(() => {
        const refreshCart = () => { try { setCart(JSON.parse(localStorage.getItem('agro_cart') || '{"items":{},"count":0,"total":0}')) } catch {} }
        window.addEventListener('agro-cart-updated', refreshCart)
        return () => window.removeEventListener('agro-cart-updated', refreshCart)
    }, [])
    function addToCart(product) {
        const next = { items: { ...cart.items, [product.id]: (cart.items[product.id] || 0) + 1 }, count: cart.count + 1, total: cart.total + product.price }
        setCart(next); localStorage.setItem('agro_cart', JSON.stringify(next)); window.dispatchEvent(new Event('agro-cart-updated'))
        setNotice(`${product.name} added to cart`)
        window.setTimeout(() => setNotice(''), 2200)
    }
    return <section className="medicine-page">
        <div className="medicine-hero"><div><p className="hero-eyebrow">AgroMart care centre</p><h1>Crop medicine<br /><em>and soil nutrition.</em></h1><p>Crop disease care, strength medicines, and trusted fertilizers for healthier plants and stronger farming families.</p></div><img className="medicine-hero-image" src="https://images.unsplash.com/photo-1523742810987-6a15d0d8b6e4?q=80&w=900&auto=format&fit=crop" alt="Healthy green crop plant" /></div>
        <div className="medicine-cart-bar"><span>{cart.count} item{cart.count === 1 ? '' : 's'} in cart</span><strong>Rs {cart.total.toLocaleString()}</strong><button type="button" onClick={clearCart} disabled={!cart.count}>Clear</button><a href="#/order">View cart and checkout →</a></div>
        {notice && <div className="shop-notice" role="status">✓ {notice}</div>}
        <div className="medicine-layout"><div><div className="agri-shop-controls medicine-controls"><div className="agri-category-tabs medicine-tabs">{['All', 'Crop medicines', 'Strength medicines', 'Fertilizer'].map((item) => <button type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><label className="agri-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicines, fertilizers..." /></label></div><div className="medicine-empty-state"><img src="https://images.unsplash.com/photo-1523742810987-6a15d0d8b6e4?q=80&w=700&auto=format&fit=crop" alt="Healthy green plant" /><div><strong>No medicine products available</strong><span>Super Admin can add medicine products from the Admin Dashboard.</span></div></div><div className="agri-product-grid">{visible.map((product) => <article className="agri-product-card" key={product.id}><div className="agri-product-image"><img src={product.image} alt={product.name} loading="lazy" /><ProductFavorite productId={product.id} productName={product.name} /></div><div className="agri-product-info"><p className="agri-product-category">{product.category}</p><h3>{product.name}</h3><span className="stock-status">In stock</span><div className="agri-product-footer"><strong>Rs {product.price.toLocaleString()}</strong><button type="button" onClick={() => addToCart(product)} aria-label={`Add ${product.name} to cart`}>+</button></div><ProductReviews productId={product.id} /></div></article>)}</div></div><aside className="medicine-assistant"><Assistant /></aside></div>
    </section>
}
