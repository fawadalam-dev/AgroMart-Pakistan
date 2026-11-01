import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { rateLimit } from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import healthRoutes from './routes/health.js'
import productRoutes from './routes/products.js'

const app = express()
const port = Number(process.env.PORT) || 3000
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

app.use(helmet())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '30mb' }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }))
app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)

app.use((_request, response) => {
    response.status(404).json({ error: 'API route not found.' })
})

app.use((error, _request, response, _next) => {
    if (error.type === 'entity.too.large') {
        return response.status(413).json({ error: 'Request body is too large.' })
    }
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return response.status(400).json({ error: 'Request body must be valid JSON.' })
    }
    if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }
    if (error.code === 11000) {
        return response.status(409).json({ error: 'A record with that value already exists.' })
    }
    console.error(error)
    return response.status(500).json({ error: 'An unexpected server error occurred.' })
})

async function startServer() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required to start the API server.')
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.')
    }

    await mongoose.connect(process.env.MONGODB_URI)
    app.listen(port, () => {
        console.log(`AgroMart API server listening on port ${port}`)
    })
}

startServer().catch((error) => {
    console.error(`Unable to start AgroMart API server: ${error.message}`)
    process.exitCode = 1
})
