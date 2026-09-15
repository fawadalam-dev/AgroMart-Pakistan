import React, { useEffect, useState } from 'react'

function loadCartProducts() {
  try {
    const cart = JSON.parse(localStorage.getItem('agro_cart') || '{}')
    const products = JSON.parse(localStorage.getItem('agro_products') || '[]')
    const productById = new Map(products.map((product) => [product.id, product]))
    return Object.entries(cart.items || {}).map(([id, quantity]) => {
      const product = productById.get(id)
      const price = Number(product?.price || 0)
      return {
        id,
        name: product?.name || id,
        quantity,
        value: price * quantity,
        price
      }
    }).filter((product) => product.quantity > 0)
  } catch (error) {
    return []
  }
}

export default function Chart() {
  const [cartProducts, setCartProducts] = useState(loadCartProducts)

  useEffect(() => {
    const refreshChart = () => setCartProducts(loadCartProducts())
    window.addEventListener('storage', refreshChart)
    window.addEventListener('agro-cart-updated', refreshChart)
    return () => {
      window.removeEventListener('storage', refreshChart)
      window.removeEventListener('agro-cart-updated', refreshChart)
    }
  }, [])

  const maximumValue = Math.max(...cartProducts.map((product) => product.value), 1)

  function buyProduct() {
    window.location.hash = '#/order'
  }

  return (
    <section className="chart-page">
      <div className="chart-heading">
        <div>
          <p className="section-kicker">Your cart overview</p>
          <h1>Added Product Chart</h1>
          <p>Products you add to cart appear here with their quantities and value.</p>
        </div>
        <div className="chart-period">{cartProducts.length} products</div>
      </div>
      {cartProducts.length ? (
        <div className="price-chart" aria-label="Chart of products added to cart">
          {cartProducts.map((item) => (
            <div className="chart-column" key={item.id}>
              <span className="chart-value">Rs {item.value} ({item.quantity}x)</span>
              <div className="chart-bar-track">
                <div className="chart-bar" style={{ height: `${(item.value / maximumValue) * 100}%` }} />
              </div>
              <strong>{item.name}</strong>
              <button type="button" className="chart-buy-btn" onClick={buyProduct}>Buy Now</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="chart-empty">Your cart is empty. Add products from the shop to see them here.</div>
      )}
    </section>
  )
}