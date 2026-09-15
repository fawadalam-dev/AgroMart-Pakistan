import React, { useEffect, useState } from 'react'
import { clearSession, getSession } from '../utils/auth'

const emptyProduct = { name: '', category: 'Vegetables', price: '', stock: '', image: '' }

function readProducts() {
    try { return JSON.parse(localStorage.getItem('agro_products') || '[]') } catch { return [] }
}

export default function Vendor() {
    const session = getSession()
    const [products, setProducts] = useState(() => session ? readProducts().filter((product) => product.vendorId === session.id) : [])
    const [product, setProduct] = useState(emptyProduct)
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!session || session.role !== 'vendor') window.location.hash = '#/login'
    }, [session])

    if (!session || session.role !== 'vendor') return null

    function updateField(event) { setProduct((current) => ({ ...current, [event.target.name]: event.target.value })) }

    function handleImage(event) {
        const file = event.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setProduct((current) => ({ ...current, image: reader.result }))
        reader.readAsDataURL(file)
    }

    function addProduct(event) {
        event.preventDefault()
        const newProduct = { ...product, id: `seller-${Date.now()}`, vendorId: session.id, vendorName: session.shopName || session.name, price: Number(product.price), stock: Number(product.stock), status: 'pending', image: product.image || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600&auto=format&fit=crop' }
        const allProducts = readProducts()
        localStorage.setItem('agro_products', JSON.stringify([...allProducts, newProduct]))
        window.dispatchEvent(new Event('agro-products-updated'))
        setProducts((current) => [...current, newProduct])
        setProduct(emptyProduct)
        setMessage('Product submitted. Super admin approval is required before customers can see it.')
    }

    function logout() { clearSession(); window.location.hash = '#/login' }

    return <section className="vendor-page">
        <div className="vendor-heading"><div><p className="section-kicker">Vendor workspace</p><h1>{session.shopName || session.name}</h1><p>Manage your shop products and stock from one place.</p></div><button type="button" className="admin-primary-btn" onClick={logout}>Log out</button></div>
        <div className="vendor-stats"><div><span>Products</span><strong>{products.length}</strong></div><div><span>Approved listings</span><strong>{products.filter((item) => item.status === 'approved').length}</strong></div><div><span>Awaiting approval</span><strong>{products.filter((item) => item.status === 'pending').length}</strong></div></div>
        <div className="vendor-layout"><article className="vendor-form-panel"><p className="panel-kicker">Shop inventory</p><h2>Add a product</h2><p className="vendor-help">New products are reviewed by admin before appearing in the customer shop.</p><form onSubmit={addProduct} className="vendor-form"><input name="name" value={product.name} onChange={updateField} placeholder="Product name" required /><select name="category" value={product.category} onChange={updateField}><option>Major Crops</option><option>Vegetables</option><option>Fruits</option><option>More Products</option></select><input name="price" value={product.price} onChange={updateField} type="number" min="1" placeholder="Price (Rs)" required /><input name="stock" value={product.stock} onChange={updateField} type="number" min="0" placeholder="Stock quantity" required /><label className="image-upload">{product.image ? 'Image selected' : 'Upload product image'}<input type="file" accept="image/*" onChange={handleImage} /></label><button className="admin-primary-btn" type="submit">Submit product</button></form>{message && <p className="vendor-message">{message}</p>}</article><article className="vendor-products-panel"><div className="panel-heading"><div><p className="panel-kicker">Your listings</p><h2>Shop products</h2></div></div>{products.length ? <div className="vendor-product-list">{products.map((item) => <div className="vendor-product" key={item.id}><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>Rs {item.price} · {item.stock} in stock</span></div><em className={`vendor-status ${item.status}`}>{item.status}</em></div>)}</div> : <p className="empty-results">You have not added any products yet.</p>}</article></div>
    </section>
}