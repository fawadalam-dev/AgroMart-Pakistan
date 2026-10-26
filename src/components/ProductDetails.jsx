import React, { useEffect, useState } from 'react'
import { getSession, isUserAccount } from '../utils/auth'
import { isFavorite, toggleFavorite } from '../utils/favorites'
import { addProductReview, getProductReviews } from '../utils/reviews'

export function ProductFavorite({ productId, productName }) {
    const session = getSession()
    const [favorite, setFavorite] = useState(() => isFavorite(productId))

    useEffect(() => {
        const refresh = () => setFavorite(isFavorite(productId))
        window.addEventListener('agro-favorites-updated', refresh)
        return () => window.removeEventListener('agro-favorites-updated', refresh)
    }, [productId])

    function handleClick(event) {
        event.stopPropagation()
        if (!session || !isUserAccount(session.role)) {
            window.location.hash = '#/login'
            return
        }
        setFavorite(toggleFavorite(productId))
    }

    return <button type="button" className={`favorite-btn${favorite ? ' is-favorite' : ''}`} onClick={handleClick} aria-label={`${favorite ? 'Remove' : 'Add'} ${productName} ${favorite ? 'from' : 'to'} favorites`} aria-pressed={favorite}>{favorite ? '♥' : '♡'}</button>
}

export function ProductReviews({ productId }) {
    const session = getSession()
    const [reviews, setReviews] = useState(() => getProductReviews(productId))
    const [open, setOpen] = useState(false)
    const [rating, setRating] = useState(5)
    const [text, setText] = useState('')

    useEffect(() => {
        const refresh = () => setReviews(getProductReviews(productId))
        window.addEventListener('agro-reviews-updated', refresh)
        return () => window.removeEventListener('agro-reviews-updated', refresh)
    }, [productId])

    function submit(event) {
        event.preventDefault()
        if (!text.trim() || !addProductReview(productId, rating, text)) return
        setText('')
        setOpen(false)
        setReviews(getProductReviews(productId))
    }

    return <div className="product-reviews">
        <button type="button" className="review-toggle" onClick={(event) => { event.stopPropagation(); setOpen((value) => !value) }}>★ 4.8 · Reviews ({reviews.length})</button>
        {reviews.length > 0 && <div className="review-list">{reviews.slice(0, 2).map((review) => <div className="review-item" key={review.id}><strong>{review.customerName} · {'★'.repeat(review.rating)}</strong><span>{review.text}</span></div>)}</div>}
        {open && <form className="review-form" onSubmit={submit}>{isUserAccount(session?.role) ? <><select value={rating} onChange={(event) => setRating(event.target.value)} aria-label="Rating"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Write your review" required rows="2" /><button type="submit">Submit review</button></> : <span>Sign in to write a review.</span>}</form>}
    </div>
}

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
