import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function authenticate(request, response, next) {
    const token = request.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) return response.status(401).json({ error: 'Sign in is required.' })

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(payload.sub)
        if (!user) return response.status(401).json({ error: 'Your session is no longer valid.' })
        request.user = user
        return next()
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: 'Your session is invalid or expired.' })
        }
        return next(error)
    }
}

export function requireAdmin(request, response, next) {
    if (request.user?.role !== 'admin') {
        return response.status(403).json({ error: 'Administrator access is required.' })
    }
    return next()
}
