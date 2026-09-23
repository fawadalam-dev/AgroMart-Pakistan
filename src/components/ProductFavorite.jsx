import React, { useEffect, useState } from 'react'
import { getSession } from '../utils/auth'
import { isFavorite, toggleFavorite } from '../utils/favorites'

export default function ProductFavorite({ productId, productName }) {
    const session = getSession()
    const [favorite, setFavorite] = useState(() => isFavorite(productId))
    useEffect(() => {
        const refresh = () => setFavorite(isFavorite(productId))
        window.addEventListener('agro-favorites-updated', refresh)
        return () => window.removeEventListener('agro-favorites-updated', refresh)
    }, [productId])
    function handleClick(event) {
        event.stopPropagation()
        if (!session || session.role !== 'customer') {
            window.location.hash = '#/login'
            return
        }
        setFavorite(toggleFavorite(productId))
    }
    return <button type="button" className={`favorite-btn${favorite ? ' is-favorite' : ''}`} onClick={handleClick} aria-label={`${favorite ? 'Remove' : 'Add'} ${productName} ${favorite ? 'from' : 'to'} favorites`} aria-pressed={favorite}>{favorite ? '♥' : '♡'}</button>
}
