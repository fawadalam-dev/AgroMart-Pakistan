import React, { useState, useEffect } from 'react'

function priceFor(name) {
  const sum = Array.from(name).reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return ((sum % 500) + 100)
}

const medicineProducts = {
  'med-strength': { name: 'Energy & Strength Tonic', price: 850, image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?q=80&w=700&auto=format&fit=crop' },
  'med-crop-disease': { name: 'Crop Disease Care Pack', price: 1450, image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=700&auto=format&fit=crop' }
}

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

export default function Order() {
  const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
  const [placed, setPlaced] = useState(false)
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '', city: '', province: '', postalCode: '' })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [formError, setFormError] = useState('')
  const [orderCustomer, setOrderCustomer] = useState(null)
  const [placedItems, setPlacedItems] = useState({})
  const [placedTotal, setPlacedTotal] = useState(0)
  const [orderHistory, setOrderHistory] = useState([])

  useEffect(() => {
    try { const raw = localStorage.getItem('agro_cart'); if (raw) setCart(JSON.parse(raw)) } catch (e) { }
    try { const savedCustomer = JSON.parse(localStorage.getItem('agro_customer') || 'null'); if (savedCustomer) setCustomer(savedCustomer) } catch (e) { }
    try { const savedOrders = JSON.parse(localStorage.getItem('agro_orders') || '[]'); if (Array.isArray(savedOrders)) setOrderHistory(savedOrders) } catch (e) { }
  }, [])

  function updateCustomer(event) {
    const { name, value } = event.target
    setCustomer((current) => ({ ...current, [name]: value }))
  }

  function placeOrder(event) {
    event.preventDefault()
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
    setFormError('')
    setOrderCustomer(customer)
    setPlacedItems(cart.items)
    setPlacedTotal(cart.total)
    setPlaced(true)
    localStorage.setItem('agro_customer', JSON.stringify(customer))
    const savedOrders = JSON.parse(localStorage.getItem('agro_orders') || '[]')
    const newOrder = { id: `AM-${Date.now().toString().slice(-6)}`, customer, items: cart.items, total: cart.total, status: 'Processing', date: new Date().toLocaleString() }
    const updatedOrders = [newOrder, ...savedOrders]
    localStorage.setItem('agro_orders', JSON.stringify(updatedOrders))
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

  function renderOrderHistory() {
    return <div className="order-history"><div className="order-history-heading"><div><p className="section-kicker">Saved purchases</p><h2>Your order history</h2></div><div className="order-shopping-links"><a className="view-order-btn" href="#/crops">Shop crops</a><a className="view-order-btn" href="#/medicine">Shop medicine</a></div></div>{orderHistory.map((order) => <article className="order-history-card" key={order.id}><div className="order-history-meta"><strong>{order.id}</strong><span>{order.date}</span><em className={`order-status ${order.status.toLowerCase()}`}>{order.status}</em></div><div className="order-history-items">{Object.entries(order.items || {}).map(([id, quantity]) => <div className="order-history-item" key={id}><img src={productImage(id)} alt="" /><span>{productName(id)} × {quantity}</span><strong>Rs {(productPrice(id) * quantity).toLocaleString()}</strong></div>)}</div><div className="order-history-total">Total: Rs {Number(order.total).toLocaleString()}</div></article>)}</div>
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
      <a className="view-order-btn" href="#/order">View your order</a>
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
      <h1>Your Order</h1>
      {rows.length === 0 ? (
        orderHistory.length ? renderOrderHistory() : <p>Your cart is empty.</p>
      ) : (
        <form className="order-list" onSubmit={placeOrder}>
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
                    <button className="qty-btn" onClick={() => updateQty(name, -1)}>-</button>
                    <span className="qty-value">{qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(name, +1)}>+</button>
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
              <label>Province<input name="province" value={customer.province} onChange={updateCustomer} placeholder="Khyber Pakhtunkhwa" /></label>
              <label>City / District<input name="city" value={customer.city} onChange={updateCustomer} placeholder="Buner" /></label>
              <label>Postal code <span className="optional-label">(optional)</span><input name="postalCode" value={customer.postalCode} onChange={updateCustomer} placeholder="17200" /></label>
              <label className="address-field">Complete delivery address<textarea name="address" value={customer.address} onChange={updateCustomer} placeholder="House number, street, village or landmark" rows="3" /></label>
            </div>
            <fieldset className="payment-options">
              <legend>Payment method</legend>
              <label><input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(event) => setPaymentMethod(event.target.value)} /> Cash on Delivery</label>
              <label><input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={(event) => setPaymentMethod(event.target.value)} /> Online Payment</label>
            </fieldset>
            {formError && <p className="checkout-error" role="alert">{formError}</p>}
            <button type="submit" className="buy-btn">Place Order</button>
          </div>
        </form>
      )}
    </section>
  )
}
