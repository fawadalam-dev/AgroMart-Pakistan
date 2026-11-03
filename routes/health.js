import { Router } from 'express'
import { getDatabaseType, isDatabaseConnected } from '../db/database.js'

const router = Router()

router.get('/health', async (_request, response) => {
    const databaseConnected = await isDatabaseConnected()
    return response.status(databaseConnected ? 200 : 503).json({
        status: databaseConnected ? 'ok' : 'degraded',
        api: 'running',
        database: databaseConnected ? 'connected' : 'disconnected',
        databaseType: getDatabaseType()
    })
})

export default router
