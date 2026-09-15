import React, { useEffect, useState } from 'react'
import { clearSession, getSession, getUsers, saveUsers } from '../utils/auth'

const initialOrders = [
    { id: 'AM-1048', buyer: 'Green Valley Farms', product: 'Premium Wheat Seeds', amount: 'Rs 18,500', status: 'Processing', date: 'Today, 10:42 AM' },
    { id: 'AM-1047', buyer: 'Ali Raza', product: 'Drip Irrigation Kit', amount: 'Rs 12,800', status: 'Shipped', date: 'Today, 09:18 AM' },
    { id: 'AM-1046', buyer: 'Bismillah Agro Store', product: 'Urea Fertilizer', amount: 'Rs 8,750', status: 'Delivered', date: 'Yesterday, 04:36 PM' },
    { id: 'AM-1045', buyer: 'Noor Agriculture', product: 'Tomato Seeds', amount: 'Rs 4,200', status: 'Processing', date: 'Yesterday, 01:12 PM' }
]

const labels = ['Apr 1', 'Apr 3', 'Apr 5', 'Apr 7', 'Apr 9', 'Apr 11', 'Apr 13', 'Apr 15', 'Apr 17', 'Apr 19', 'Apr 21', 'Apr 23']

export default function Admin() {
    const [orders, setOrders] = useState(initialOrders)
    const [activeTab, setActiveTab] = useState('Overview')
    const [users, setUsers] = useState(getUsers)
    const [products, setProducts] = useState(() => { try { return JSON.parse(localStorage.getItem('agro_products') || '[]') } catch { return [] } })
    const session = getSession()

    useEffect(() => {
        if (!session || session.role !== 'admin') window.location.hash = '#/login'
    }, [session])

    if (!session || session.role !== 'admin') return null

    const pendingVendors = users.filter((user) => user.role === 'vendor' && user.status === 'pending')
    const pendingProducts = products.filter((product) => product.id?.startsWith('seller-') && product.status === 'pending')

    function updateVendor(id, status) {
        const updated = users.map((user) => user.id === id ? { ...user, status } : user)
        saveUsers(updated)
        setUsers(updated)
    }

    function updateProduct(id, status) {
        const updated = products.map((product) => product.id === id ? { ...product, status } : product)
        localStorage.setItem('agro_products', JSON.stringify(updated))
        window.dispatchEvent(new Event('agro-products-updated'))
        setProducts(updated)
    }

    function logout() { clearSession(); window.location.hash = '#/login' }

    function advanceOrder(id) {
        setOrders((current) => current.map((order) => {
            if (order.id !== id) return order
            const nextStatus = order.status === 'Processing' ? 'Shipped' : order.status === 'Shipped' ? 'Delivered' : 'Delivered'
            return { ...order, status: nextStatus }
        }))
    }

    return (
        <section className="admin-page">
            <div className="admin-heading">
                <div><p className="section-kicker">Super admin control center</p><h1>Good morning, Admin</h1><p>Approve vendors, products, and manage the AgroMart marketplace.</p></div>
                <button type="button" className="admin-primary-btn" onClick={logout}>Log out</button>
            </div>

            <div className="admin-tabs" role="tablist" aria-label="Dashboard sections">
                {['Overview', 'Vendors', 'Products', 'Orders', 'Inventory'].map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
                <span className="admin-date">Last updated: just now</span>
            </div>

            {(activeTab === 'Overview' || activeTab === 'Vendors') && <article className="admin-panel approval-panel"><div className="panel-heading"><div><p className="panel-kicker">Vendor onboarding</p><h2>Pending vendor approvals <span className="approval-count">{pendingVendors.length}</span></h2></div></div>{pendingVendors.length ? <div className="approval-list">{pendingVendors.map((vendor) => <div className="approval-row" key={vendor.id}><div><strong>{vendor.shopName || vendor.name}</strong><span>{vendor.name} · {vendor.email}</span></div><div><button type="button" className="approve-btn" onClick={() => updateVendor(vendor.id, 'approved')}>Approve</button><button type="button" className="reject-btn" onClick={() => updateVendor(vendor.id, 'rejected')}>Reject</button></div></div>)}</div> : <p className="empty-results">No vendors are waiting for approval.</p>}</article>}

            {(activeTab === 'Overview' || activeTab === 'Products') && <article className="admin-panel approval-panel"><div className="panel-heading"><div><p className="panel-kicker">Marketplace catalog</p><h2>Pending product approvals <span className="approval-count">{pendingProducts.length}</span></h2></div></div>{pendingProducts.length ? <div className="approval-list">{pendingProducts.map((product) => <div className="approval-row" key={product.id}><div><strong>{product.name}</strong><span>{product.vendorName} · {product.category} · Rs {product.price} · Stock {product.stock}</span></div><div><button type="button" className="approve-btn" onClick={() => updateProduct(product.id, 'approved')}>Approve</button><button type="button" className="reject-btn" onClick={() => updateProduct(product.id, 'rejected')}>Reject</button></div></div>)}</div> : <p className="empty-results">No products are waiting for approval.</p>}</article>}

            <div className="admin-stats">
                <article className="admin-stat-card"><div className="stat-icon stat-icon-green">Rs</div><div><p>Total revenue</p><strong>Rs 284,650</strong><span className="stat-change positive">+12.8% <small>vs last month</small></span></div></article>
                <article className="admin-stat-card"><div className="stat-icon stat-icon-blue">↗</div><div><p>Total orders</p><strong>1,248</strong><span className="stat-change positive">+8.4% <small>vs last month</small></span></div></article>
                <article className="admin-stat-card"><div className="stat-icon stat-icon-yellow">◷</div><div><p>Pending orders</p><strong>36</strong><span className="stat-change warning">Needs attention</span></div></article>
                <article className="admin-stat-card"><div className="stat-icon stat-icon-red">!</div><div><p>Low stock items</p><strong>12</strong><span className="stat-change danger">4 critical items</span></div></article>
            </div>

            <div className="admin-main-grid">
                <article className="admin-panel sales-panel"><div className="panel-heading"><div><p className="panel-kicker">Performance</p><h2>Sales overview</h2></div><select aria-label="Sales period" defaultValue="30"><option value="30">Last 30 days</option><option value="7">Last 7 days</option><option value="365">This year</option></select></div><div className="sales-total"><strong>Rs 284,650</strong><span className="stat-change positive">+12.8%</span></div><div className="sales-chart" aria-label="Sales increased over the last 30 days"><div className="chart-y-labels"><span>30k</span><span>20k</span><span>10k</span><span>0</span></div><div className="chart-plot"><div className="chart-grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 600 190" preserveAspectRatio="none" role="img" aria-label="Sales trend line"><defs><linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#86efac" stopOpacity=".5" /><stop offset="100%" stopColor="#86efac" stopOpacity="0" /></linearGradient></defs><path d="M0 142 L54 118 L109 130 L164 88 L218 103 L273 64 L327 78 L382 28 L436 53 L491 41 L545 70 L600 18 L600 190 L0 190 Z" fill="url(#salesFill)" /><path d="M0 142 L54 118 L109 130 L164 88 L218 103 L273 64 L327 78 L382 28 L436 53 L491 41 L545 70 L600 18" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><div className="chart-x-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div></div></div></article>

                <article className="admin-panel inventory-panel"><div className="panel-heading"><div><p className="panel-kicker">Stock health</p><h2>Inventory alerts</h2></div><a href="#/crops">View all</a></div><div className="inventory-summary"><div className="inventory-ring"><strong>84%</strong><span>Healthy</span></div><div className="inventory-legend"><span><i className="dot healthy" />Healthy <b>128</b></span><span><i className="dot low" />Low stock <b>12</b></span><span><i className="dot out" />Out of stock <b>3</b></span></div></div><div className="alert-list"><div><span>Urea Fertilizer</span><b>Only 8 bags left</b><em>Restock</em></div><div><span>Tomato Seeds</span><b>Only 14 packs left</b><em>Restock</em></div></div></article>
            </div>

            <div className="admin-bottom-grid"><article className="admin-panel orders-panel"><div className="panel-heading"><div><p className="panel-kicker">Marketplace activity</p><h2>Recent orders</h2></div><a href="#/order">View all orders</a></div><div className="orders-table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{order.date}</small></td><td>{order.buyer}</td><td>{order.product}</td><td><strong>{order.amount}</strong></td><td><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></td><td><button type="button" className="order-action" onClick={() => advanceOrder(order.id)} disabled={order.status === 'Delivered'}>{order.status === 'Delivered' ? 'Complete' : 'Advance'}</button></td></tr>)}</tbody></table></div></article><article className="admin-panel quick-panel"><div className="panel-heading"><div><p className="panel-kicker">Shortcuts</p><h2>Quick actions</h2></div></div><div className="quick-actions"><a href="#/crops"><span>▦</span><b>Manage products</b><small>Add, edit or remove listings</small></a><a href="#/order"><span>✓</span><b>Review orders</b><small>Process pending deliveries</small></a><a href="#/prices"><span>◆</span><b>Update market prices</b><small>Keep farmer data current</small></a></div></article></div>
        </section>
    )
}