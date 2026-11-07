import app from '../app.js'
import { connectDatabase } from '../db/database.js'

function restoreApiPath(request) {
    const requestUrl = new URL(request.url, 'http://localhost')
    const path = requestUrl.searchParams.get('__api_path')
    if (path === null) return

    requestUrl.searchParams.delete('__api_path')
    const query = requestUrl.searchParams.toString()
    request.url = `/api/${path}${query ? `?${query}` : ''}`
}

export default async function handler(request, response) {
    try {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.')
        }
        restoreApiPath(request)
        await connectDatabase()
        return app(request, response)
    } catch (error) {
        console.error('Unable to initialize the AgroMart API:', error)
        return response.status(503).json({ error: 'The API database is unavailable.' })
    }
}
