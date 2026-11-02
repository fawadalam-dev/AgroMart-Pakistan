import mongoose from 'mongoose'

export default function requireDatabase(_request, response, next) {
    if (mongoose.connection.readyState !== 1) {
        return response.status(503).json({ error: 'Database is unavailable. Please try again later.' })
    }
    return next()
}
