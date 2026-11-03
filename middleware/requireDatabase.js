import { query } from '../db/database.js'

export default async function requireDatabase(_request, response, next) {
    try {
        await query('SELECT 1')
        return next()
    } catch (error) {
        console.error('Database request failed:', error)
        return response.status(503).json({ error: 'Database is unavailable. Please try again later.' })
    }
}
