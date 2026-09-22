import React, { useEffect, useState } from 'react'
import { clearSession, getSession, getUsers, saveUsers, setSession } from '../utils/auth'
import { getFavorites } from '../utils/favorites'
import { pakistanLocations } from '../utils/pakistanLocations'

function readProducts() {
    try {
        const products = JSON.parse(localStorage.getItem('agro_products') || '[]')
        return Array.isArray(products) ? products : []
    } catch {
        return []
    }
}

export default function Profile() {
    const session = getSession()
    const isCustomer = session?.role === 'customer'
    const [favorites, setFavorites] = useState(() => getFavorites())
    const [products, setProducts] = useState(readProducts)
    const [details, setDetails] = useState(() => {
        try { return JSON.parse(localStorage.getItem(`agro_account_${session?.id || 'guest'}`) || localStorage.getItem(`agro_customer_${session?.id || 'guest'}`) || JSON.stringify({ name: session?.name || '', email: session?.email || '', phone: '', address: '', city: '', province: '', postalCode: '' })) } catch { return { name: session?.name || '', email: session?.email || '', phone: '', address: '', city: '', province: '', postalCode: '' } }
    })
    const [message, setMessage] = useState('')
    useEffect(() => {
        if (!session || !['customer', 'admin'].includes(session.role)) window.location.hash = '#/login'
        const refresh = () => { setFavorites(getFavorites()); setProducts(readProducts()) }
        window.addEventListener('agro-favorites-updated', refresh)
        window.addEventListener('agro-products-updated', refresh)
        return () => {
            window.removeEventListener('agro-favorites-updated', refresh)
            window.removeEventListener('agro-products-updated', refresh)
        }
    }, [session])
    if (!session || !['customer', 'admin'].includes(session.role)) return null
    const favoriteProducts = favorites.map((id) => products.find((product) => product.id === id)).filter(Boolean)
    const districts = pakistanLocations[details.province] || []
    function logout() { clearSession(); window.location.hash = '#/login' }
    function updateDetails(event) { setDetails((current) => ({ ...current, [event.target.name]: event.target.value })) }
    function saveDetails(event) {
        event.preventDefault()
        localStorage.setItem(`agro_account_${session.id}`, JSON.stringify(details))
        const users = getUsers()
        const updatedUser = users.find((user) => user.id === session.id)
        if (updatedUser) {
            saveUsers(users.map((user) => user.id === session.id ? { ...user, name: details.name, email: details.email, phone: details.phone } : user))
            setSession({ ...updatedUser, name: details.name, email: details.email, phone: details.phone })
        }
        setMessage('Profile details updated successfully.')
    }
    return <section className="profile-page">
        <div className="profile-heading"><div><p className="section-kicker">{isCustomer ? 'Customer profile' : 'Super Admin profile'}</p><h1>{session.name}</h1><p>{session.email}</p></div><button type="button" className="admin-primary-btn" onClick={logout}>Log out</button></div>
        {isCustomer && <div className="profile-summary"><strong>{favoriteProducts.length}</strong><span>Saved favorites</span></div>}
        <form className="profile-details" onSubmit={saveDetails}><div className="panel-heading"><div><p className="panel-kicker">Account details</p><h2>Edit delivery information</h2></div></div><div className="profile-form-grid"><label>Full name<input name="name" value={details.name} onChange={updateDetails} required /></label><label>Email<input type="email" name="email" value={details.email} onChange={updateDetails} required /></label><label>Phone<input name="phone" value={details.phone} onChange={updateDetails} placeholder="03XX XXXXXXX" /></label><label>Province<select name="province" value={details.province} onChange={(event) => setDetails((current) => ({ ...current, province: event.target.value, city: '' }))}><option value="">Select province</option>{Object.keys(pakistanLocations).map((province) => <option key={province}>{province}</option>)}</select></label><label>District / City<select name="city" value={details.city} onChange={updateDetails} disabled={!districts.length}><option value="">Select district</option>{districts.map((district) => <option key={district}>{district}</option>)}</select></label><label>Postal code<input name="postalCode" value={details.postalCode} onChange={updateDetails} /></label><label className="profile-address">Address<textarea name="address" value={details.address} onChange={updateDetails} rows="3" /></label></div><button className="admin-primary-btn" type="submit">Save details</button>{message && <p className="admin-success-message">{message}</p>}</form>
        {isCustomer && <div className="profile-favorites"><div className="panel-heading"><div><p className="panel-kicker">Your collection</p><h2>Favorite products</h2></div></div>{favoriteProducts.length ? <div className="agri-product-grid">{favoriteProducts.map((product) => <article className="agri-product-card" key={product.id}><div className="agri-product-image"><img src={product.image} alt={product.name} /></div><div className="agri-product-info"><p className="agri-product-category">{product.category}</p><h3>{product.name}</h3><strong>Rs {Number(product.price).toLocaleString()}</strong></div></article>)}</div> : <p className="empty-results">You have not saved any favorite products yet.</p>}</div>}
    </section>
}
