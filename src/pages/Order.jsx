import React, { useState, useEffect } from 'react'
import { getSession, isUserAccount } from '../utils/auth'
import { pakistanLocations } from '../utils/pakistanLocations'
import { catalogProducts, mergeCatalogProducts } from '../utils/catalogProducts'
import { cancelOrder as cancelApiOrder, createOrder as createApiOrder, fetchOrders, syncLocalOrders } from '../utils/api'

function readProducts() {
  try {
    const stored = JSON.parse(localStorage.getItem('agro_products') || '[]')
    const hidden = JSON.parse(localStorage.getItem('agro_hidden_catalog_products') || '[]')
    return mergeCatalogProducts(Array.isArray(stored) ? stored : [], Array.isArray(hidden) ? hidden : [])
  } catch {
    return catalogProducts
  }
}

function priceFor(name) {
  const sum = Array.from(name).reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return ((sum % 500) + 100)
}

const medicineProducts = {
  'med-strength': { name: 'Energy & Strength Tonic', price: 850, image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?q=80&w=700&auto=format&fit=crop' },
  'med-crop-disease': { name: 'Crop Disease Care Pack', price: 1450, image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=700&auto=format&fit=crop' }
}

const paymentMethods = [
  ['cod', 'Cash on Delivery']
]

function productImage(id) {
  const product = readProducts().find((item) => item.id === id)
  return product?.image || medicineProducts[id]?.image || `https://source.unsplash.com/400x300/?${encodeURIComponent(id + ' field')}`
}

function productPrice(id) {
  const product = readProducts().find((item) => item.id === id)
  return product ? Number(product.price) : medicineProducts[id]?.price || priceFor(id)
}

function productName(id) {
  const product = readProducts().find((item) => item.id === id)
  return product?.name || medicineProducts[id]?.name || id
}

function canCancelOrder(order) {
  const createdAt = order.createdAt || new Date(order.date).getTime()
  return order.status === 'Processing' && Number.isFinite(createdAt) && Date.now() - createdAt <= 5 * 60 * 60 * 1000
}

export default function Order() {
  const session = getSession()
  const [cart, setCart] = useState({ items: {}, count: 0, total: 0 })
  const [placed, setPlaced] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState('')
  const [customer, setCustomer] = useState({ name: session?.name || '', email: session?.email || '', phone: '', address: '', city: '', province: '', postalCode: '' })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [paymentSettings, setPaymentSettings] = useState({ cod: true, easypaisa: true, jazzcash: true, bank: true, paymentStatus: 'Active' })
  const [formError, setFormError] = useState('')
  const [orderCustomer, setOrderCustomer] = useState(null)
  const [placedItems, setPlacedItems] = useState({})
  const [placedTotal, setPlacedTotal] = useState(0)
  const [orderHistory, setOrderHistory] = useState([])
  const [orderError, setOrderError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isCurrent = true
    try { const raw = localStorage.getItem('agro_cart'); if (raw) setCart(JSON.parse(raw)) } catch (e) { }
    try { const savedCustomer = JSON.parse(localStorage.getItem(`agro_account_${session?.id || 'guest'}`) || localStorage.getItem(`agro_customer_${session?.id || 'guest'}`) || 'null'); if (savedCustomer) setCustomer(savedCustomer) } catch (e) { }
    try {
      const savedSettings = JSON.parse(localStorage.getItem(`agro_settings_${session?.id || 'guest'}`) || 'null')
      if (savedSettings) { setPaymentSettings((current) => ({ ...current, ...savedSettings })); if (savedSettings.paymentMethod) setPaymentMethod(savedSettings.paymentMethod) }
    } catch (e) { }
    async function loadOrders() {
      if (!isUserAccount(session?.role) && session?.role !== 'admin') return
      try {
        const remoteOrders = await fetchOrders()
        if (!isCurrent) return
        setOrderHistory(remoteOrders)
        setOrderError('')
        if (session.role === 'admin') {
          return
        }
        const savedOrders = JSON.parse(localStorage.getItem('agro_orders') || '[]')
        const legacyOrders = Array.isArray(savedOrders) ? savedOrders.filter((order) => {
          const ownerEmail = String(order.ownerEmail || order.customer?.email || '')
          return (order.ownerId === session.id || ownerEmail.toLowerCase() === session.email.toLowerCase())
              && !remoteOrders.some((remoteOrder) => remoteOrder.clientOrderId === (order.clientOrderId || order.id) || remoteOrder.id === order.id)
        }) : []
        if (legacyOrders.length) {
          const products = readProducts()
          const legacyPayload = legacyOrders.map((order) => ({
            ...order,
            itemDetails: Object.entries(order.items || {}).map(([productId, quantity]) => {
              const product = products.find((item) => item.id === productId)
              return {
                productId,
                name: productName(productId),
                price: product ? Number(product.price) : productPrice(productId),
                quantity: Number(quantity),
                image: product?.image || medicineProducts[productId]?.image || ''
              }
            })
          }))
          const syncedOrders = []
          for (let index = 0; index < legacyPayload.length; index += 25) {
            syncedOrders.push(...await syncLocalOrders(legacyPayload.slice(index, index + 25)))
          }
          if (!isCurrent) return
          const syncedByClientId = new Map(syncedOrders.map((order) => [order.clientOrderId, order]))
          const updatedLocalOrders = savedOrders.map((order) => syncedByClientId.has(order.clientOrderId || order.id)
            ? syncedByClientId.get(order.clientOrderId || order.id)
            : order)
          localStorage.setItem('agro_orders', JSON.stringify(updatedLocalOrders))
          window.dispatchEvent(new Event('agro-orders-updated'))
          setOrderHistory([...syncedOrders, ...remoteOrders].sort((a, b) => b.createdAt - a.createdAt))
        }
      } catch (error) {
        if (isCurrent) setOrderError(`Could not load or sync orders: ${error.message}`)
      }
    }
    loadOrders()
    const refreshCart = () => {
      try { setCart(JSON.parse(localStorage.getItem('agro_cart') || '{"items":{},"count":0,"total":0}')) } catch { }
    }
    window.addEventListener('agro-cart-updated', refreshCart)
    window.addEventListener('storage', refreshCart)
    return () => {
      isCurrent = false
      window.removeEventListener('agro-cart-updated', refreshCart)
      window.removeEventListener('storage', refreshCart)
    }
  }, [])

  function updateCustomer(event) {
    const { name, value } = event.target
    setCustomer((current) => ({ ...current, [name]: value }))
  }

  async function placeOrder(event) {
    event.preventDefault()
    if (isSubmitting) return
    if (!rows.length) {
      setFormError('Your cart is empty. Add products before placing an order.')
      return
    }
    if (!isUserAccount(session?.role)) {
      setFormError('Sign in with your AgroMart user account to place an order.')
      return
    }
    if (!availablePaymentMethods.some(([key]) => key === paymentMethod)) {
      setFormError('Cash on Delivery is currently unavailable. Please contact AgroMart before ordering.')
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
    setFormError('')
    try {
      setIsSubmitting(true)
      const itemDetails = rows.map(([productId, quantity]) => ({
        productId,
        name: productName(productId),
        price: productPrice(productId),
        quantity: Number(quantity),
        image: productImage(productId)
      }))
      const clientOrderId = `AM-${Date.now()}-${crypto.randomUUID()}`
      const newOrder = await createApiOrder({
        clientOrderId,
        customer,
        items: cart.items,
        itemDetails,
        total: orderGrandTotal
      })
      setOrderCustomer(customer)
      setPlacedItems(cart.items)
      setPlacedTotal(newOrder.total)
      setPlacedOrderId(newOrder.id)
      setPlaced(true)
      const updatedOrders = [newOrder, ...orderHistory.filter((order) => order.id !== newOrder.id)]
      setOrderHistory(updatedOrders)
      try {
        localStorage.setItem(`agro_customer_${session.id}`, JSON.stringify(customer))
        localStorage.setItem('agro_orders', JSON.stringify(updatedOrders))
        window.dispatchEvent(new Event('agro-orders-updated'))
      } catch (error) {
        setOrderError(`Order was saved online, but this browser could not update its local cache: ${error.message}`)
      }
      try {
        const products = readProducts()
        const updatedProducts = products.map((product) => cart.items[product.id] ? { ...product, stock: Math.max(0, Number(product.stock || 0) - cart.items[product.id]) } : product)
        localStorage.setItem('agro_products', JSON.stringify(updatedProducts))
        window.dispatchEvent(new Event('agro-products-updated'))
      } catch (error) {
        setOrderError(`Order was saved online, but the local product cache could not be updated: ${error.message}`)
      }
      try {
        localStorage.removeItem('agro_cart')
      } catch (error) {
        setOrderError(`Order was saved online, but the local cart could not be cleared: ${error.message}`)
      }
      setCart({ items: {}, count: 0, total: 0 })
    } catch (error) {
      setFormError(`Could not place your order: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const rows = Object.entries(cart.items)
  const cartChartItems = rows.map(([id, quantity]) => ({ id, name: productName(id), quantity, value: productPrice(id) * quantity }))
  const maxCartValue = Math.max(1, ...cartChartItems.map((item) => item.value))
  const districts = pakistanLocations[customer.province] || []
  const subtotal = cartChartItems.reduce((sum, item) => sum + item.value, 0)
  const deliveryFee = subtotal >= 10000 ? 0 : 200
  const codFee = paymentMethod === 'cod' ? 50 : 0
  const orderGrandTotal = subtotal + deliveryFee + codFee
  const availablePaymentMethods = paymentSettings.paymentStatus === 'Active'
    ? paymentMethods.filter(([key]) => paymentSettings[key] !== false)
    : []

  const visibleOrderHistory = session?.role === 'admin' ? orderHistory : orderHistory.filter((order) => {
    const orderEmail = order.ownerEmail || order.customer?.email || ''
    return session && (order.ownerId === session.id || orderEmail.toLowerCase() === session.email.toLowerCase())
  })

  async function cancelOrder(orderId) {
    const order = orderHistory.find((item) => item.id === orderId)
    if (!order || !canCancelOrder(order)) return
    try {
      const cancelledOrder = await cancelApiOrder(orderId)
      const updatedOrders = orderHistory.map((item) => item.id === orderId ? cancelledOrder : item)
      setOrderHistory(updatedOrders)
      setOrderError('')
    } catch (error) {
      setOrderError(`Could not cancel order: ${error.message}`)
    }
  }

  function goToCheckout() {
    if (!isUserAccount(session?.role)) {
      window.location.hash = '#/login'
      return
    }
    document.querySelector('.order-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function renderOrderHistory() {
    return <div className="order-history"><div className="order-history-heading"><div><p className="section-kicker">Saved purchases</p><h2>{session?.role === 'admin' ? 'All customer orders' : 'Your order history'}</h2></div>{session?.role !== 'admin' && <div className="order-shopping-links"><a className="view-order-btn" href="#/crops">Shop crops</a><a className="view-order-btn" href="#/medicine">Shop medicine</a></div>}</div>{orderError && <p className="checkout-error" role="alert">{orderError}</p>}{visibleOrderHistory.map((order) => {
      const detailsById = new Map((order.itemDetails || []).map((item) => [item.productId, item]))
      return <article className="order-history-card" key={order.id}><div className="order-history-meta"><strong>{order.id}</strong><span>{new Date(order.date).toLocaleString()}</span><em className={`order-status ${order.status.toLowerCase()}`}>{order.status}</em></div><div className="order-history-items">{Object.entries(order.items || {}).map(([id, quantity]) => {
        const detail = detailsById.get(id)
        const name = detail?.name || productName(id)
        const price = detail ? Number(detail.price) : productPrice(id)
        return <div className="order-history-item" key={id}><img src={detail?.image || productImage(id)} alt="" /><span>{name} × {quantity}</span><strong>Rs {(price * quantity).toLocaleString()}</strong></div>
      })}</div><div className="order-history-total">Total: Rs {Number(order.total).toLocaleString()}</div><p className="order-payment-status">Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod || 'Not specified'} · {order.paymentStatus || 'Payment status unavailable'}</p>{canCancelOrder(order) && <button type="button" className="order-cancel-btn" onClick={() => cancelOrder(order.id)}>Cancel order</button>}</article>
    })}</div>
  }

  if (placed) return (
    <section>
      <h1>Order saved</h1>
      <p>Order {placedOrderId} has been sent to AgroMart and saved online. Pay Rs {placedTotal.toLocaleString()} in cash to the courier on delivery; no online payment was taken.</p>
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
    <div className="checkout-header"><strong>AgroMart Pakistan</strong><span>Cash on Delivery · Pay at your doorstep</span></div>
    <h1>Checkout</h1>
      {orderError && <p className="checkout-error" role="alert">{orderError}</p>}
      <section className="order-chart-panel" aria-label="Cart product chart">
        <div className="order-chart-heading"><div><p className="section-kicker">Your cart overview</p><h2>Added Product Chart</h2><p>Product quantities and values update with your cart.</p></div><span className="chart-period">{cartChartItems.length} products</span></div>
        {cartChartItems.length ? <div className="order-chart-bars">{cartChartItems.map((item) => <article className="order-chart-column" key={item.id}><span className="order-chart-value">Rs {item.value.toLocaleString()} · {item.quantity}x</span><div className="order-chart-track"><div className="order-chart-bar" style={{ height: `${Math.max(4, item.value / maxCartValue * 100)}%` }} /></div><strong title={item.name}>{item.name}</strong><button type="button" className="chart-buy-btn" onClick={goToCheckout}>Buy now</button></article>)}</div> : <div className="chart-empty">Your cart is empty. Add products from Agro Shop to see their quantity and value here.</div>}
      </section>
      {!isUserAccount(session?.role) && rows.length > 0 ? (
        <p className="checkout-error">Please sign in with your AgroMart account to place an order.</p>
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

          <div className="order-total">Subtotal: Rs {subtotal.toLocaleString()}</div>
          <div className="checkout-section">
            <h2>Delivery details</h2>
            <p className="checkout-hint">Complete your full address and contact details before ordering.</p>
            <div className="checkout-grid">
              <label>Full name<input name="name" value={customer.name} onChange={updateCustomer} placeholder="Your full name" autoComplete="name" required /></label>
              <label>Email<input type="email" name="email" value={customer.email} onChange={updateCustomer} placeholder="you@example.com" autoComplete="email" required /></label>
              <label>Phone number<input type="tel" name="phone" value={customer.phone} onChange={updateCustomer} placeholder="03XX XXXXXXX" autoComplete="tel" required /></label>
              <label>Province<select name="province" value={customer.province} onChange={(event) => setCustomer((current) => ({ ...current, province: event.target.value, city: '' }))} required><option value="">Select province</option>{Object.keys(pakistanLocations).map((province) => <option key={province}>{province}</option>)}</select></label>
              <label>District / City<select name="city" value={customer.city} onChange={updateCustomer} disabled={!districts.length} required><option value="">Select district</option>{districts.map((district) => <option key={district}>{district}</option>)}</select></label>
              <label>Postal code <span className="optional-label">(optional)</span><input name="postalCode" value={customer.postalCode} onChange={updateCustomer} placeholder="17200" /></label>
              <label className="address-field">Complete delivery address<textarea name="address" value={customer.address} onChange={updateCustomer} placeholder="House number, street, village or landmark" rows="3" autoComplete="street-address" required /></label>
            </div>
            <fieldset className="payment-options">
              <legend>Payment method</legend>
              {availablePaymentMethods.map(([key, label]) => <label key={key}><input type="radio" name="payment" value={key} checked={paymentMethod === key} onChange={(event) => setPaymentMethod(event.target.value)} required /> {label}</label>)}
            </fieldset>
            <p className="payment-note">Online card, Easypaisa, JazzCash, and bank payments are not enabled. Pay the courier in cash when your order arrives.</p>
            <p className="checkout-local-notice">Your order will be saved online and visible to AgroMart after you place it.</p>
            {formError && <p className="checkout-error" role="alert">{formError}</p>}
            <button type="submit" className="buy-btn" disabled={!availablePaymentMethods.length || isSubmitting}>{isSubmitting ? 'Sending order...' : 'Place COD order'}</button>
          </div>
          </div>
          <aside className="checkout-summary">
            <h2>🛒 Order Summary</h2>
            {rows.map(([name, qty]) => <div className="summary-item" key={name}><span>{productName(name)} × {qty}</span><strong>Rs {(productPrice(name) * qty).toLocaleString()}</strong></div>)}
            <div className="summary-line"><span>Subtotal</span><strong>Rs {subtotal.toLocaleString()}</strong></div>
            <div className="summary-line"><span>Delivery</span><strong>Rs {deliveryFee.toLocaleString()}</strong></div>
            <div className="summary-line"><span>Cash collection fee</span><strong>Rs {codFee.toLocaleString()}</strong></div>
            <div className="summary-total"><span>Total</span><strong>Rs {orderGrandTotal.toLocaleString()}</strong></div>
            <button type="submit" className="summary-place-order" disabled={!availablePaymentMethods.length || isSubmitting}>{isSubmitting ? 'SENDING ORDER...' : <>PLACE COD ORDER <span>Rs {orderGrandTotal.toLocaleString()}</span></>}</button>
            <p className="summary-secure">Pay cash to the courier on delivery</p>
          </aside>
        </form>
      )}
    </section>
  )
}
