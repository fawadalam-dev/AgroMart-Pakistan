import { Router } from 'express'
import mongoose from 'mongoose'

const router = Router()

router.get('/health', (_request, response) => {
    const databaseConnected = mongoose.connection.readyState === 1
    return response.status(databaseConnected ? 200 : 503).json({
        status: databaseConnected ? 'ok' : 'degraded',
        api: 'running',
        database: databaseConnected ? 'connected' : 'disconnected'
    })
})

export default router
