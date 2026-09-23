import React, { useEffect, useState } from 'react'
import ProductFavorite from './ProductFavorite'
import ProductReviews from './ProductReviews'

export default function ProductDetails({ product, onClose, onAddToCart }) {
    const images = product.images?.length ? product.images : [product.image]
    const [activeImage, setActiveImage] = useState(images[0])

    useEffect(() => {
        const closeOnEscape = (event) => { if (event.key === 'Escape') onClose() }
        document.addEventListener('keydown', closeOnEscape)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', closeOnEscape)
            document.body.style.overflow = previousOverflow
        }
    }, [onClose])

    return <div className="product-detail-backdrop" role="presentation" onClick={onClose}>
        <article className="product-detail-modal" role="dialog" aria-modal="true" aria-labelledby="product-detail-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="product-detail-close" onClick={onClose} aria-label="Close product details">&times;</button>
            <div className="product-detail-gallery">
                <div className="product-detail-main-image"><img src={activeImage} alt={product.name} /></div>
                {images.length > 1 && <div className="product-detail-thumbnails">{images.map((image, index) => <button type="button" className={activeImage === image ? 'is-active' : ''} key={`${image}-${index}`} onClick={() => setActiveImage(image)}><img src={image} alt={`${product.name} view ${index + 1}`} /></button>)}</div>}
            </div>
            <div className="product-detail-content">
                <div className="product-detail-heading"><div><p className="agri-product-category">{product.category}</p><h2 id="product-detail-title">{product.name}</h2></div><ProductFavorite productId={product.id} productName={product.name} /></div>
                <div className="product-detail-rating"><strong>★ {product.rating || '4.8'}</strong><span>{product.reviews || 0} reviews</span></div>
                <p className="product-detail-price">Rs {Number(product.price).toLocaleString()}</p>
                <div className="product-detail-facts"><span><b>Pack size</b>{product.packSize || 0} {product.unit || 'kg'}</span><span><b>Stock</b>{Number(product.stock) === 0 ? 'Out of stock' : `${product.stock} items available`}</span></div>
                <p className="product-detail-description">{product.details || 'Quality AgroMart product selected for farmers, growers, and home gardens.'}</p>
                <h3>How to use</h3>
                <p className="product-detail-usage">{product.usage || 'Follow the instructions on the product packaging. Store in a cool, dry place and keep away from children.'}</p>
                <button type="button" className="product-detail-add" onClick={() => onAddToCart(product)} disabled={Number(product.stock) === 0}>{Number(product.stock) === 0 ? 'Out of stock' : 'Add to cart'}</button>
                <ProductReviews productId={product.id} />
            </div>
        </article>
    </div>
}
