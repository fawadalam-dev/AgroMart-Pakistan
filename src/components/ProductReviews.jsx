import React, { useEffect, useState } from 'react'
import { addProductReview, getProductReviews } from '../utils/reviews'
import { getSession } from '../utils/auth'

export default function ProductReviews({ productId }) {
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
        {open && <form className="review-form" onSubmit={submit}>{session?.role === 'customer' ? <><select value={rating} onChange={(event) => setRating(event.target.value)} aria-label="Rating"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Write your review" required rows="2" /><button type="submit">Submit review</button></> : <span>Sign in as a customer to write a review.</span>}</form>}
    </div>
}
