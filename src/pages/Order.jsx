import React, { useState, useEffect } from 'react'
import { getSession } from '../utils/auth'
import { pakistanLocations } from '../utils/pakistanLocations'

function priceFor(name) {
  const sum = Array.from(name).reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return ((sum % 500) + 100)
}

const medicineProducts = {
  'med-strength': { name: 'Energy & Strength Tonic', price: 850, image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?q=80&w=700&auto=format&fit=crop' },
  'med-crop-disease': { name: 'Crop Disease Care Pack', price: 1450, image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=700&auto=format&fit=crop' }
}

const paymentMethods = [
  ['cod', 'Cash on Delivery'],
  ['easypaisa', 'Easypaisa'],
  ['jazzcash', 'JazzCash'],
  ['bank', 'Bank Transfer']
]

function productImage(id) {
  try {
    const products = JSON.parse(localStorage.getItem('agro_products') || '[]')
    const product = products.find((item) => item.id === id)
    return product?.image || medicineProducts[id]?.image || `https://source.unsplash.com/400x300/?${encodeURIComponent(id + ' field')}`
  } catch (e) {
    return `https://source.unsplash.com/400x300/?${encodeURIComponent(id + ' field')}`
  }
}

function productPrice(id) {
  try {
    const products = JSON.parse(localStorage.getItem('agro_products') || '[]')
    const product = products.find((item) => item.id === id)
    return product ? Number(product.price) : medicineProducts[id]?.price || priceFor(id)
  } catch (e) {
    return priceFor(id)
  }
}

function productName(id) {
  try {
    const products = JSON.parse(localStorage.getItem('agro_products') || '[]')
    const product = products.find((item) => item.id === id)
    return product?.name || medicineProducts[id]?.name || id
  } catch (e) {
    return id
  }
}

function canCancelOrder(order) {
  const createdAt = order.createdAt || new Date(order.date).getTime()
  return order.status === 'Processing' && Number.isFinite(createdAt) && Date.now() - createdAt <= 5 * 60 * 60 * 1000
}

export default function Order() {
  const session = getSession()
  const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
  const [placed, setPlaced] = useState(false)
  const [customer, setCustomer] = useState({ name: session?.name || '', email: session?.email || '', phone: '', address: '', city: '', province: '', postalCode: '' })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentSettings, setPaymentSettings] = useState({ cod: true, easypaisa: true, jazzcash: true, bank: true, paymentStatus: 'Active' })
  const [formError, setFormError] = useState('')
  const [orderCustomer, setOrderCustomer] = useState(null)
  const [placedItems, setPlacedItems] = useState({})
  const [placedTotal, setPlacedTotal] = useState(0)
  const [orderHistory, setOrderHistory] = useState([])

  useEffect(() => {
    try { const raw = localStorage.getItem('agro_cart'); if (raw) setCart(JSON.parse(raw)) } catch (e) { }
    try { const savedCustomer = JSON.parse(localStorage.getItem(`agro_account_${session?.id || 'guest'}`) || localStorage.getItem(`agro_customer_${session?.id || 'guest'}`) || 'null'); if (savedCustomer) setCustomer(savedCustomer) } catch (e) { }
    try {
      const savedSettings = JSON.parse(localStorage.getItem(`agro_settings_${session?.id || 'guest'}`) || 'null')
      if (savedSettings) { setPaymentSettings((current) => ({ ...current, ...savedSettings })); if (savedSettings.paymentMethod) setPaymentMethod(savedSettings.paymentMethod) }
    } catch (e) { }
    try { const savedOrders = JSON.parse(localStorage.getItem('agro_orders') || '[]'); if (Array.isArray(savedOrders)) setOrderHistory(savedOrders) } catch (e) { }
  }, [])

  function updateCustomer(event) {
    const { name, value } = event.target
    setCustomer((current) => ({ ...current, [name]: value }))
  }

  function placeOrder(event) {
    event.preventDefault()
    if (session?.role !== 'customer') {
      setFormError('Only customers can place orders.')
      return
    }
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'province']
    if (requiredFields.some((field) => !customer[field].trim())) {
      setFormError('Please complete your full name, email, phone, address, city, and province.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(customer.email)) {
      setFormError('Please enter a valid email address.')
      return
    }
    if (!/^[+]?[0-9\s-]{10,}$/.test(customer.phone)) {
      setFormError('Please enter a valid phone number.')
      return
    }
    if (paymentMethod !== 'cod' && !paymentReference.trim()) {
      setFormError('Please enter the payment reference or transaction ID.')
      return
    }
    setFormError('')
    setOrderCustomer(customer)
    setPlacedItems(cart.items)
    setPlacedTotal(orderGrandTotal)
    setPlaced(true)
    localStorage.setItem(`agro_customer_${session.id}`, JSON.stringify(customer))
    const savedOrders = JSON.parse(localStorage.getItem('agro_orders') || '[]')
    const newOrder = {
      id: `AM-${Date.now().toString().slice(-6)}`,
      customer,
      ownerId: session?.id || '',
      ownerEmail: session?.email || customer.email.toLowerCase().trim(),
      ownerName: session?.name || customer.name,
      items: cart.items,
      total: orderGrandTotal,
      status: 'Processing',
      paymentMethod,
      paymentReference: paymentReference.trim(),
      paymentStatus: paymentMethod === 'cod' ? 'Pending COD' : 'Pending verification',
      createdAt: Date.now(),
      date: new Date().toLocaleString()
    }
    const updatedOrders = [newOrder, ...savedOrders]
    localStorage.setItem('agro_orders', JSON.stringify(updatedOrders))
    window.dispatchEvent(new Event('agro-orders-updated'))
    setOrderHistory(updatedOrders)
    try {
      const products = JSON.parse(localStorage.getItem('agro_products') || '[]')
      const updatedProducts = products.map((product) => cart.items[product.id] ? { ...product, stock: Math.max(0, Number(product.stock || 0) - cart.items[product.id]) } : product)
      localStorage.setItem('agro_products', JSON.stringify(updatedProducts))
      window.dispatchEvent(new Event('agro-products-updated'))
    } catch (e) { }
    localStorage.removeItem('agro_cart')
    setCart({ items: {}, count: 0, total: 0 })
  }

  const rows = Object.entries(cart.items)
  const districts = pakistanLocations[customer.province] || []
  const deliveryFee = shippingMethod === 'free' ? 0 : 200
  const codFee = paymentMethod === 'cod' ? 50 : 0
  const orderGrandTotal = cart.total + deliveryFee + codFee

  const visibleOrderHistory = session?.role === 'admin' ? orderHistory : orderHistory.filter((order) => {
    const orderEmail = order.ownerEmail || order.customer?.email || ''
    return session && (order.ownerId === session.id || orderEmail.toLowerCase() === session.email.toLowerCase())
  })

  function cancelOrder(orderId) {
    const order = orderHistory.find((item) => item.id === orderId)
    if (!order || !canCancelOrder(order)) return
    const updatedOrders = orderHistory.map((item) => item.id === orderId ? { ...item, status: 'Cancelled', cancelledAt: Date.now() } : item)
    localStorage.setItem('agro_orders', JSON.stringify(updatedOrders))
    setOrderHistory(updatedOrders)
    window.dispatchEvent(new Event('agro-orders-updated'))
    try {
      const products = JSON.parse(localStorage.getItem('agro_products') || '[]')
      const restoredProducts = products.map((product) => order.items?.[product.id] ? { ...product, stock: Number(product.stock || 0) + order.items[product.id] } : product)
      localStorage.setItem('agro_products', JSON.stringify(restoredProducts))
      window.dispatchEvent(new Event('agro-products-updated'))
    } catch { }
  }

  function renderOrderHistory() {
    return <div className="order-history"><div className="order-history-heading"><div><p className="section-kicker">Saved purchases</p><h2>{session?.role === 'admin' ? 'All customer orders' : 'Your order history'}</h2></div>{session?.role !== 'admin' && <div className="order-shopping-links"><a className="view-order-btn" href="#/crops">Shop crops</a><a className="view-order-btn" href="#/medicine">Shop medicine</a></div>}</div>{visibleOrderHistory.map((order) => <article className="order-history-card" key={order.id}><div className="order-history-meta"><strong>{order.id}</strong><span>{order.date}</span><em className={`order-status ${order.status.toLowerCase()}`}>{order.status}</em></div><div className="order-history-items">{Object.entries(order.items || {}).map(([id, quantity]) => <div className="order-history-item" key={id}><img src={productImage(id)} alt="" /><span>{productName(id)} × {quantity}</span><strong>Rs {(productPrice(id) * quantity).toLocaleString()}</strong></div>)}</div><div className="order-history-total">Total: Rs {Number(order.total).toLocaleString()}</div>{canCancelOrder(order) && <button type="button" className="order-cancel-btn" onClick={() => cancelOrder(order.id)}>Cancel order</button>}</article>)}</div>
  }

  if (placed) return (
    <section>
      <h1>Order placed</h1>
      <p>Thank you — your order has been received via {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}.</p>
      <div className="placed-order-products"><strong>Products purchased</strong>{Object.entries(placedItems).map(([id, quantity]) => <div className="placed-order-product" key={id}><span>{productName(id)} × {quantity}</span><strong>Rs {(productPrice(id) * quantity).toLocaleString()}</strong></div>)}<div className="placed-order-total">Total: Rs {placedTotal.toLocaleString()}</div></div>
      <div className="delivery-confirmation">
        <strong>Delivery details</strong>
        <span>{orderCustomer.name} · {orderCustomer.phone}</span>
        <span>{orderCustomer.email}</span>
        <span>{orderCustomer.address}, {orderCustomer.city}, {orderCustomer.province}{orderCustomer.postalCode ? `, ${orderCustomer.postalCode}` : ''}</span>
      </div>
      <a className="view-order-btn" href="#/order" onClick={() => setPlaced(false)}>View your order</a>
    </section>
  )

  function updateQty(name, delta) {
    setCart((prev) => {
      const items = { ...prev.items }
      const curr = items[name] || 0
      const next = Math.max(0, curr + delta)
      if (next === 0) delete items[name]
      else items[name] = next
      let count = 0
      let total = 0
      Object.entries(items).forEach(([k, v]) => { count += v; total += productPrice(k) * v })
      const nxt = { items, count, total }
      try { localStorage.setItem('agro_cart', JSON.stringify(nxt)) } catch (e) { }
      return nxt
    })
  }

  return (
    <section className="order-page">
    <div className="checkout-header"><strong>AgroMart Pakistan</strong><span>🔒 Secure Checkout</span></div>
    <h1>Checkout</h1>
      {session?.role !== 'customer' && rows.length > 0 ? (
        <p className="checkout-error">Only customers can place orders. Please sign in with a customer account.</p>
      ) : rows.length === 0 ? (
        visibleOrderHistory.length ? renderOrderHistory() : <p>Your cart is empty.</p>
      ) : (
        <form className="order-list" onSubmit={placeOrder}>
          <div className="checkout-main">
          {rows.map(([name, qty]) => {
            const price = productPrice(name)
            const img = productImage(name)
            const displayName = productName(name)
            return (
              <div className="order-row" key={name}>
                <img src={img} alt={displayName} className="order-img" />
                <div className="order-info">
                  <div className="order-name">{displayName}</div>
                  <div className="qty-controls">
                    <button type="button" className="qty-btn" onClick={() => updateQty(name, -1)}>-</button>
                    <span className="qty-value">{qty}</span>
                    <button type="button" className="qty-btn" onClick={() => updateQty(name, +1)}>+</button>
                  </div>
                  <div>Unit: Rs {price}</div>
                  <div>Subtotal: Rs {price * qty}</div>
                </div>
              </div>
            )
          })}

          <div className="order-total">Total: Rs {cart.total}</div>
          <div className="checkout-section">
            <h2>Delivery details</h2>
            <p className="checkout-hint">Complete your full address and contact details before ordering.</p>
            <div className="checkout-grid">
              <label>Full name<input name="name" value={customer.name} onChange={updateCustomer} placeholder="Your full name" /></label>
              <label>Email<input type="email" name="email" value={customer.email} onChange={updateCustomer} placeholder="you@example.com" /></label>
              <label>Phone number<input type="tel" name="phone" value={customer.phone} onChange={updateCustomer} placeholder="03XX XXXXXXX" /></label>
              <label>Province<select name="province" value={customer.province} onChange={(event) => setCustomer((current) => ({ ...current, province: event.target.value, city: '' }))} required><option value="">Select province</option>{Object.keys(pakistanLocations).map((province) => <option key={province}>{province}</option>)}</select></label>
              <label>District / City<select name="city" value={customer.city} onChange={updateCustomer} disabled={!districts.length} required><option value="">Select district</option>{districts.map((district) => <option key={district}>{district}</option>)}</select></label>
              <label>Postal code <span className="optional-label">(optional)</span><input name="postalCode" value={customer.postalCode} onChange={updateCustomer} placeholder="17200" /></label>
              <label className="address-field">Complete delivery address<textarea name="address" value={customer.address} onChange={updateCustomer} placeholder="House number, street, village or landmark" rows="3" /></label>
            </div>
            <fieldset className="payment-options">
              <legend>Payment method</legend>
              {paymentMethods.filter(([key]) => paymentSettings[key] !== false && paymentSettings.paymentStatus !== 'Maintenance').map(([key, label]) => <label key={key}><input type="radio" name="payment" value={key} checked={paymentMethod === key} onChange={(event) => setPaymentMethod(event.target.value)} /> {label}</label>)}
            </fieldset>
            <fieldset className="payment-options shipping-options">
              <legend>Shipping method</legend>
              <label><input type="radio" name="shipping" value="standard" checked={shippingMethod === 'standard'} onChange={(event) => setShippingMethod(event.target.value)} /> Standard delivery <span>Rs 200</span></label>
              <label><input type="radio" name="shipping" value="free" checked={shippingMethod === 'free'} onChange={(event) => setShippingMethod(event.target.value)} /> Free delivery <span>Rs 0</span></label>
            </fieldset>
            {paymentMethod !== 'cod' && <label className="payment-reference">Payment reference / transaction ID<input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Enter transaction ID" required /></label>}
            {formError && <p className="checkout-error" role="alert">{formError}</p>}
            <button type="submit" className="buy-btn">Place Order</button>
          </div>
          </div>
          <aside className="checkout-summary">
            <h2>🛒 Order Summary</h2>
            {rows.map(([name, qty]) => <div className="summary-item" key={name}><span>{productName(name)} × {qty}</span><strong>Rs {(productPrice(name) * qty).toLocaleString()}</strong></div>)}
            <div className="summary-line"><span>Subtotal</span><strong>Rs {cart.total.toLocaleString()}</strong></div>
            <div className="summary-line"><span>Delivery</span><strong>Rs {deliveryFee.toLocaleString()}</strong></div>
            <div className="summary-line"><span>COD fee</span><strong>Rs {codFee.toLocaleString()}</strong></div>
            <div className="summary-total"><span>Total</span><strong>Rs {orderGrandTotal.toLocaleString()}</strong></div>
            <button type="submit" className="summary-place-order">🟢 PLACE ORDER <span>Rs {orderGrandTotal.toLocaleString()}</span></button>
            <p className="summary-secure">🔒 Secure &amp; Encrypted</p>
          </aside>
        </form>
      )}
    </section>
  )
}
