import React, { useEffect, useState } from 'react'
import { clearSession, getSession, getUsers, saveUsers } from '../utils/auth'
import { advanceOrder as advanceApiOrder, createProduct as createApiProduct, deleteProduct as deleteApiProduct, fetchOrders, fetchProducts, setProductStatus, updateProduct as updateApiProduct } from '../utils/api'

const emptyProduct = { name: '', category: 'Major Crops', price: '', stock: '', packSize: '', unit: 'kg', details: '', usage: '', sections: ['crops'], images: [], image: '' }

const productSections = [
    ['crops', 'Crops'],
    ['seeds', 'Seeds'],
    ['fertilizers', 'Fertilizers'],
    ['medicine', 'Medicine'],
    ['agriShop', 'Agri Shop']
]
const maxImageSize = 10 * 1024 * 1024
const maxTotalImageSize = 10 * 1024 * 1024

function getOrderDate(order) {
    const date = new Date(order.date)
    return Number.isNaN(date.getTime()) ? new Date() : date
}

function formatChartDate(date, period) {
    return period === '365'
        ? date.toLocaleDateString('en-US', { month: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatAmount(value) {
    return `Rs ${Number(value || 0).toLocaleString()}`
}

function getOrderProducts(order) {
    const names = order.itemDetails?.map((item) => item.name).filter(Boolean)
    return names?.length ? names.join(', ') : `${Object.keys(order.items || {}).length} products`
}

export default function Admin() {
    const [orders, setOrders] = useState([])
    const [activeTab, setActiveTab] = useState('Overview')
    const [orderFilter, setOrderFilter] = useState('all')
    const [users, setUsers] = useState(getUsers)
    const [products, setProducts] = useState([])
    const [remoteProducts, setRemoteProducts] = useState([])
    const [productForm, setProductForm] = useState(emptyProduct)
    const [editingId, setEditingId] = useState(null)
    const [salesPeriod, setSalesPeriod] = useState('30')
    const [productMessage, setProductMessage] = useState('')
    const [orderMessage, setOrderMessage] = useState('')
    const session = getSession()

    useEffect(() => {
        if (!session || session.role !== 'admin') window.location.hash = '#/login'
    }, [session])

    useEffect(() => {
        const refreshDashboard = () => {
            setUsers(getUsers())
        }
        window.addEventListener('storage', refreshDashboard)
        window.addEventListener('agro-users-updated', refreshDashboard)
        window.addEventListener('agro-products-updated', refreshDashboard)
        window.addEventListener('agro-orders-updated', refreshDashboard)
        return () => {
            window.removeEventListener('storage', refreshDashboard)
            window.removeEventListener('agro-users-updated', refreshDashboard)
            window.removeEventListener('agro-products-updated', refreshDashboard)
            window.removeEventListener('agro-orders-updated', refreshDashboard)
        }
    }, [])

    useEffect(() => {
        let isCurrent = true
        async function loadOrders() {
            try {
                const items = await fetchOrders()
                if (isCurrent) {
                    setOrders(items)
                    setOrderMessage('')
                }
            } catch (error) {
                if (isCurrent) setOrderMessage(`Could not load online orders: ${error.message}`)
            }
        }
        loadOrders()
        const intervalId = window.setInterval(loadOrders, 15000)
        return () => {
            isCurrent = false
            window.clearInterval(intervalId)
        }
    }, [])

    useEffect(() => {
        let isCurrent = true
        async function loadProducts() {
            try {
                const items = await fetchProducts({ all: true })
                if (!isCurrent) return
                setRemoteProducts(items)
                setProducts(items)
            } catch (error) {
                if (isCurrent) setProductMessage(`Could not load products from the API: ${error.message}`)
            }
        }
        loadProducts()
        return () => { isCurrent = false }
    }, [])

    if (!session || session.role !== 'admin') return null

    const adminName = session.name?.trim() ? `${session.name.trim().charAt(0).toUpperCase()}${session.name.trim().slice(1)}` : 'Admin'
    const pendingProducts = products.filter((product) => product.status === 'pending')
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const pendingOrders = orders.filter((order) => order.status === 'Processing').length
    const cancelledOrders = orders.filter((order) => order.status === 'Cancelled').length
    const lowStockProducts = products.filter((product) => product.stock != null && Number(product.stock) > 0 && Number(product.stock) <= 10)
    const outOfStockProducts = products.filter((product) => product.stock != null && Number(product.stock) === 0)
    const healthyStockProducts = products.filter((product) => product.stock == null || Number(product.stock) > 10)
    const stockTotal = products.length || 1
    const stockHealth = Math.round((healthyStockProducts.length / stockTotal) * 100)
    const periodDays = Number(salesPeriod)
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - periodDays + 1)
    const salesBuckets = Array.from({ length: 12 }, (_, index) => {
        const bucketDate = new Date(periodStart)
        bucketDate.setDate(periodStart.getDate() + Math.round((periodDays - 1) * index / 11))
        const nextBucketDate = new Date(periodStart)
        nextBucketDate.setDate(periodStart.getDate() + Math.round((periodDays - 1) * (index + 1) / 11))
        return { date: bucketDate, end: nextBucketDate, value: 0 }
    })
    orders.forEach((order) => {
        const date = getOrderDate(order)
        const bucket = salesBuckets.find((item, index) => date >= item.date && (index === salesBuckets.length - 1 || date < item.end))
        if (bucket) bucket.value += Number(order.total || 0)
    })
    const maxSales = Math.max(...salesBuckets.map((bucket) => bucket.value), 1)
    const chartPoints = salesBuckets.map((bucket, index) => `${index * (600 / 11)} ${170 - (bucket.value / maxSales) * 145}`).join(' L')
    const chartLabels = salesBuckets.map((bucket) => formatChartDate(bucket.date, salesPeriod))
    const recentOrders = orders.slice(0, 8).map((order) => ({ ...order, buyer: order.customer?.name || order.ownerName || 'Customer', product: `${Object.keys(order.items || {}).length} products`, amount: formatAmount(order.total), date: order.date }))
    const filteredOrders = orders.filter((order) => orderFilter === 'all' || order.status === orderFilter)
    const inventoryAlerts = [...lowStockProducts, ...outOfStockProducts]

    function showOrders(filter) {
        setOrderFilter(filter)
        setActiveTab('Orders')
    }

    function editProduct(product) {
        setEditingId(product.id)
        setProductForm({
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock || 0,
            packSize: product.packSize || '',
            unit: product.unit || 'kg',
            details: product.details || '',
            usage: product.usage || '',
            sections: product.sections || ['crops'],
            images: product.images || [product.image],
            image: product.image
        })
    }

    async function updateProduct(id, status) {
        try {
            const updatedProduct = await setProductStatus(id, status)
            setRemoteProducts((current) => current.map((product) => product.id === id ? updatedProduct : product))
            setProducts((current) => current.map((product) => product.id === id ? updatedProduct : product))
        } catch (error) {
            setProductMessage(`Could not update product status: ${error.message}`)
        }
    }
    function handleImageFile(event) {
        const file = event.target.files?.[0]
        if (!file) return
        if (file.size > maxImageSize) {
            window.alert('Please choose an image smaller than 10 MB.')
            event.target.value = ''
            return
        }
        const reader = new FileReader()
        reader.onload = () => setProductForm((current) => ({ ...current, image: reader.result }))
        reader.readAsDataURL(file)
    }

    function handleMultipleImages(event) {
        const files = Array.from(event.target.files || [])
        if (!files.length) return
        if (files.some((file) => file.size > maxImageSize) || files.reduce((total, file) => total + file.size, 0) > maxTotalImageSize) {
            window.alert('Each image must be smaller than 10 MB and all selected images together must fit within 10 MB.')
            event.target.value = ''
            return
        }
        Promise.all(files.map((file) => new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(file)
        }))).then((images) => setProductForm((current) => ({ ...current, images, image: images[0] || current.image })))
    }

    function toggleProductSection(section) {
        setProductForm((current) => {
            const sections = current.sections.includes(section)
                ? current.sections.filter((item) => item !== section)
                : [...current.sections, section]
            return { ...current, sections: sections.length ? sections : [section] }
        })
    }

    async function saveProduct(event) {
        event.preventDefault()
        const images = productForm.images.length ? productForm.images : [productForm.image || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600&auto=format&fit=crop']
        const item = { ...productForm, images, id: editingId || `admin-${Date.now()}`, price: Number(productForm.price), stock: Number(productForm.stock), packSize: Number(productForm.packSize) || 0, status: 'approved', image: images[0] }
        const apiItem = { ...item }
        delete apiItem.id
        delete apiItem.status
        try {
            if (editingId) {
                const saved = await updateApiProduct(editingId, apiItem)
                setRemoteProducts((current) => current.map((product) => product.id === editingId ? saved : product))
                setProducts((current) => current.map((product) => product.id === editingId ? saved : product))
            } else {
                const saved = await createApiProduct(apiItem)
                setRemoteProducts((current) => [saved, ...current])
                setProducts((current) => [saved, ...current])
            }
            window.dispatchEvent(new Event('agro-products-updated'))
            setProductForm(emptyProduct)
            setEditingId(null)
            setProductMessage(`${item.name} saved successfully.`)
        } catch (error) {
            setProductMessage(`Could not save product: ${error.message}`)
        }
    }

    async function deleteProduct(id) {
        try {
            await deleteApiProduct(id)
            setRemoteProducts((current) => current.filter((product) => product.id !== id))
            setProducts((current) => current.filter((product) => product.id !== id))
            window.dispatchEvent(new Event('agro-products-updated'))
            setProductMessage('Product deleted from the shared catalog.')
        } catch (error) {
            setProductMessage(`Could not delete product: ${error.message}`)
        }
    }

    function logout() { clearSession(); window.location.hash = '#/login' }

    async function advanceOrder(id) {
        const order = orders.find((item) => item.id === id)
        if (!order || order.status === 'Cancelled' || order.status === 'Delivered') return
        const nextStatus = order.status === 'Processing' ? 'Shipped' : 'Delivered'
        try {
            const updatedOrder = await advanceApiOrder(id, nextStatus)
            setOrders((current) => current.map((item) => item.id === id ? updatedOrder : item))
            setOrderMessage('')
        } catch (error) {
            setOrderMessage(`Could not update order status: ${error.message}`)
        }
    }

    return (
        <section className="admin-page">
            <div className="admin-heading">
                <div><p className="section-kicker">Super admin control center</p><h1>Good morning, {adminName}</h1><p>Manage users, products, orders, and inventory across AgroMart.</p></div>
                <button type="button" className="admin-primary-btn" onClick={logout}>Log out</button>
            </div>

            <div className="admin-tabs" role="tablist" aria-label="Dashboard sections">
                {['Overview', 'Products', 'Orders', 'Inventory'].map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
                <span className="admin-date">Last updated: just now</span>
            </div>
            {orderMessage && <p className="auth-message" role="alert">{orderMessage}</p>}

            <div className="admin-stats" aria-label="Dashboard summary">
                <button type="button" className="admin-stat-card" onClick={() => showOrders('all')} aria-label="Show all order totals included in revenue">
                    <span className="stat-icon stat-icon-green">Rs</span><span className="admin-stat-copy"><span className="admin-stat-label">Total revenue</span><strong>{formatAmount(totalRevenue)}</strong><span className="stat-change positive">All order totals</span></span><span className="admin-stat-arrow" aria-hidden="true">↗</span>
                </button>
                <button type="button" className="admin-stat-card" onClick={() => showOrders('all')} aria-label="Show all orders">
                    <span className="stat-icon stat-icon-blue">↗</span><span className="admin-stat-copy"><span className="admin-stat-label">Total orders</span><strong>{orders.length.toLocaleString()}</strong><span className="stat-change positive">All user orders</span></span><span className="admin-stat-arrow" aria-hidden="true">↗</span>
                </button>
                <button type="button" className="admin-stat-card" onClick={() => showOrders('Processing')} aria-label="Show pending orders">
                    <span className="stat-icon stat-icon-yellow">◷</span><span className="admin-stat-copy"><span className="admin-stat-label">Pending orders</span><strong>{pendingOrders}</strong><span className="stat-change warning">Needs attention</span></span><span className="admin-stat-arrow" aria-hidden="true">↗</span>
                </button>
                <button type="button" className="admin-stat-card" onClick={() => { setActiveTab('Inventory'); setEditingId(null) }} aria-label="Show low and out-of-stock products">
                    <span className="stat-icon stat-icon-red">!</span><span className="admin-stat-copy"><span className="admin-stat-label">Low stock items</span><strong>{lowStockProducts.length}</strong><span className="stat-change danger">{outOfStockProducts.length} out of stock</span></span><span className="admin-stat-arrow" aria-hidden="true">↗</span>
                </button>
                <button type="button" className="admin-stat-card" onClick={() => showOrders('Cancelled')} aria-label="Show cancelled orders">
                    <span className="stat-icon stat-icon-red">×</span><span className="admin-stat-copy"><span className="admin-stat-label">Cancelled orders</span><strong>{cancelledOrders}</strong><span className="stat-change danger">User cancellations</span></span><span className="admin-stat-arrow" aria-hidden="true">↗</span>
                </button>
            </div>

            {activeTab === 'Orders' && <article className="admin-panel admin-crud-panel metric-detail-panel">
                <div className="panel-heading"><div><p className="panel-kicker">Order details</p><h2>{orderFilter === 'all' ? 'All orders' : orderFilter === 'Processing' ? 'Pending orders' : `${orderFilter} orders`}</h2></div>
                    <select aria-label="Filter orders" value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)}>
                        <option value="all">All orders</option><option value="Processing">Pending</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                {filteredOrders.length ? <div className="admin-product-table">{filteredOrders.map((order) => <div className="admin-product-row" key={order.id}><div><strong>{order.id}</strong><span>{order.customer?.name || order.ownerName || 'Customer'} · {order.customer?.phone || ''} · {getOrderProducts(order)} · {formatAmount(order.total)} · {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod || 'Payment method unavailable'} · {order.date || ''}</span></div><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span><button type="button" className="order-action" onClick={() => advanceOrder(order.id)} disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>{order.status === 'Delivered' ? 'Complete' : order.status === 'Cancelled' ? 'Cancelled' : 'Advance order'}</button></div>)}</div> : <p className="empty-results">No orders match this selection.</p>}
            </article>}

            {activeTab === 'Inventory' && <article className="admin-panel admin-crud-panel metric-detail-panel">
                <div className="panel-heading"><div><p className="panel-kicker">Stock requiring attention</p><h2>Low and out-of-stock products</h2></div><span className="admin-inventory-count">{inventoryAlerts.length} items</span></div>
                {inventoryAlerts.length ? <div className="admin-product-table">{inventoryAlerts.map((product) => <div className="admin-product-row" key={product.id}><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{product.category} · {product.stock === 0 ? 'Out of stock' : `${product.stock} remaining`}</span></div><span className={`inventory-alert-status${Number(product.stock) === 0 ? ' is-out' : ''}`}>{Number(product.stock) === 0 ? 'Restock now' : 'Low stock'}</span><button type="button" className="order-action" onClick={() => editProduct(product)}>Update stock</button></div>)}</div> : <p className="empty-results">All products have healthy stock levels.</p>}
            </article>}

            {(activeTab === 'Overview' || activeTab === 'Products') && <article className="admin-panel approval-panel"><div className="panel-heading"><div><p className="panel-kicker">Marketplace catalog</p><h2>Pending product approvals <span className="approval-count">{pendingProducts.length}</span></h2></div></div>{pendingProducts.length ? <div className="approval-list">{pendingProducts.map((product) => <div className="approval-row" key={product.id}><div><strong>{product.name}</strong><span>{product.vendorName} · {product.category} · Rs {product.price} · Stock {product.stock}</span></div><div><button type="button" className="approve-btn" onClick={() => updateProduct(product.id, 'approved')}>Approve</button><button type="button" className="reject-btn" onClick={() => updateProduct(product.id, 'rejected')}>Reject</button></div></div>)}</div> : <p className="empty-results">No products are waiting for approval.</p>}</article>}

            {(activeTab === 'Products' || activeTab === 'Inventory') && <article className="admin-panel admin-crud-panel">
                <div className="panel-heading"><div><p className="panel-kicker">Catalog and stock management</p><h2>{editingId ? 'Edit product' : 'Add product'}</h2></div></div>
                {productMessage && <p className="auth-message" role="status">{productMessage}</p>}
                <form className="admin-product-form" onSubmit={saveProduct}>
                    <input required placeholder="Product name" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} />
                    <select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>
                        <option>Major Crops</option><option>Crop Products</option><option>Vegetables</option><option>Fruits</option><option>Seeds</option><option>Fertilizer</option><option>Crop medicines</option><option>Farming Tools</option><option>Safety Gear</option>
                    </select>
                    <fieldset className="admin-product-sections"><legend>Show product in</legend>{productSections.map(([value, label]) => <label key={value}><input type="checkbox" checked={productForm.sections.includes(value)} onChange={() => toggleProductSection(value)} />{label}</label>)}</fieldset>
                    <input required min="1" type="number" placeholder="Price (Rs)" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} />
                    <input required min="0" type="number" placeholder="Stock quantity (items)" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} />
                    <div className="admin-stock-field"><input required min="0" step="any" type="number" placeholder="Pack size" value={productForm.packSize} onChange={(event) => setProductForm({ ...productForm, packSize: event.target.value })} /><select aria-label="Pack size unit" value={productForm.unit} onChange={(event) => setProductForm({ ...productForm, unit: event.target.value })}><option value="kg">Kilogram (kg)</option><option value="gram">Gram (g)</option><option value="tonne">Tonne (t)</option><option value="litre">Litre (L)</option><option value="ml">Millilitre (mL)</option><option value="piece">Piece</option><option value="bag">Bag</option><option value="packet">Packet</option><option value="bottle">Bottle</option><option value="dozen">Dozen</option></select></div>
                    <textarea className="admin-product-details" placeholder="Product details (optional)" value={productForm.details} onChange={(event) => setProductForm({ ...productForm, details: event.target.value })} />
                    <div className="admin-image-fields">
                        <input placeholder="Image URL (optional)" value={productForm.image.startsWith('data:') ? '' : productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} />
                        <div className="admin-image-actions">
                            <label className="admin-file-btn">Upload image<input type="file" accept="image/*" onChange={handleImageFile} /></label>
                            <label className="admin-file-btn">Use camera<input type="file" accept="image/*" capture="environment" onChange={handleImageFile} /></label>
                            <label className="admin-file-btn">Multiple images<input type="file" accept="image/*" multiple onChange={handleMultipleImages} /></label>
                        </div>
                    </div>
                    <textarea className="admin-product-details" placeholder="How to use this product (optional)" value={productForm.usage} onChange={(event) => setProductForm({ ...productForm, usage: event.target.value })} />
                    <button className="admin-primary-btn" type="submit">{editingId ? 'Save changes' : 'Add product'}</button>
                    {editingId && <button type="button" className="reject-btn" onClick={() => { setEditingId(null); setProductForm(emptyProduct) }}>Cancel</button>}
                </form>
                <div className="admin-product-table">{products.map((product) => <div className="admin-product-row" key={product.id}><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{product.category} · Rs {Number(product.price).toLocaleString()} · {product.stock == null ? 'In stock' : product.stock === 0 ? 'Out of stock' : `${product.stock} items in stock`}</span></div><button type="button" className="order-action" onClick={() => editProduct(product)}>Edit</button><button type="button" className="reject-btn" onClick={() => deleteProduct(product.id)}>Delete</button></div>)}</div>
            </article>}

            <div className="admin-main-grid">
                <article className="admin-panel sales-panel"><div className="panel-heading"><div><p className="panel-kicker">Performance</p><h2>Sales overview</h2></div><select aria-label="Sales period" value={salesPeriod} onChange={(event) => setSalesPeriod(event.target.value)}><option value="30">Last 30 days</option><option value="7">Last 7 days</option><option value="365">This year</option></select></div><div className="sales-total"><strong>{formatAmount(salesBuckets.reduce((sum, bucket) => sum + bucket.value, 0))}</strong><span className="stat-change positive">Live order sales</span></div><div className="sales-chart" aria-label="Sales overview based on customer orders"><div className="chart-y-labels"><span>{formatAmount(maxSales)}</span><span>{formatAmount(maxSales / 2)}</span><span>Rs 0</span></div><div className="chart-plot"><div className="chart-grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 600 190" preserveAspectRatio="none" role="img" aria-label="Sales trend line"><defs><linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#86efac" stopOpacity=".5" /><stop offset="100%" stopColor="#86efac" stopOpacity="0" /></linearGradient></defs><path d={`M${chartPoints} L600 190 L0 190 Z`} fill="url(#salesFill)" /><path d={`M${chartPoints}`} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><div className="chart-x-labels">{chartLabels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div></div></div></article>

                <article className="admin-panel inventory-panel"><div className="panel-heading"><div><p className="panel-kicker">Stock health</p><h2>Inventory alerts</h2></div><a href="#/crops">View all</a></div><div className="inventory-summary"><div className="inventory-ring"><strong>{stockHealth}%</strong><span>Healthy</span></div><div className="inventory-legend"><span><i className="dot healthy" />Healthy <b>{healthyStockProducts.length}</b></span><span><i className="dot low" />Low stock <b>{lowStockProducts.length}</b></span><span><i className="dot out" />Out of stock <b>{outOfStockProducts.length}</b></span></div></div><div className="alert-list">{[...lowStockProducts, ...outOfStockProducts].slice(0, 3).map((product) => <div key={product.id}><span>{product.name}</span><b>{product.stock === 0 ? 'Out of stock' : `Only ${product.stock} left`}</b><em>Restock</em></div>)}{!lowStockProducts.length && !outOfStockProducts.length && <div><span>All products</span><b>Stock levels are healthy</b><em>Good</em></div>}</div></article>
            </div>

            <div className="admin-bottom-grid"><article className="admin-panel orders-panel"><div className="panel-heading"><div><p className="panel-kicker">Marketplace activity</p><h2>Recent orders</h2></div><a href="#/order">View all orders</a></div><div className="orders-table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{order.date}</small></td><td>{order.buyer}</td><td>{order.product}</td><td><strong>{order.amount}</strong></td><td><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></td><td><button type="button" className="order-action" onClick={() => advanceOrder(order.id)} disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>{order.status === 'Delivered' ? 'Complete' : order.status === 'Cancelled' ? 'Cancelled by customer' : 'Advance'}</button></td></tr>)}</tbody></table>{!recentOrders.length && <p className="empty-results">No orders have been placed yet.</p>}</div></article><article className="admin-panel quick-panel"><div className="panel-heading"><div><p className="panel-kicker">Marketplace snapshot</p><h2>Live totals</h2></div></div><div className="quick-actions"><a href="#/crops"><span>▦</span><b>Manage products</b><small>{products.length} catalog items</small></a><a href="#/order"><span>✓</span><b>Review orders</b><small>{pendingOrders} pending orders</small></a><a href="#/medicine"><span>◆</span><b>Medicine products</b><small>Managed by Super Admin</small></a></div></article></div>
        </section>
    )
}