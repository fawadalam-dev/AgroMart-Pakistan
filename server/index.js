import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectDatabase } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const legacyDataPath = join(__dirname, 'data.json')

dotenv.config()

const port = Number(process.env.PORT || 4000)
const jwtSecret = process.env.JWT_SECRET || 'agromart-local-development-secret'
const adminEmail = process.env.ADMIN_EMAIL || 'fawadalam5813@gmail.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'fawadalam58'
const adminName = process.env.ADMIN_NAME || 'Fawad Alam'
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
const apiPublicUrl = process.env.API_PUBLIC_URL || 'http://localhost:4000'

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.use(passport.initialize())

app.get('/api/health', (_request, response) => {
    response.json({ ok: true, service: 'AgroMart API' })
})

app.get('/api/state', async (_request, response) => {
    const database = await connectDatabase()
    const records = await database.collection('app_state').find({}).toArray()
    response.json(Object.fromEntries(records.map((record) => [record.key, record.value])))
})

app.put('/api/state/:key', async (request, response) => {
    const database = await connectDatabase()
    await database.collection('app_state').updateOne(
        { key: request.params.key },
        { $set: { key: request.params.key, value: request.body.value, updatedAt: new Date().toISOString() } },
        { upsert: true }
    )
    response.status(204).end()
})

app.delete('/api/state/:key', async (request, response) => {
    const database = await connectDatabase()
    await database.collection('app_state').deleteOne({ key: request.params.key })
    response.status(204).end()
})

function publicUser(user) {
    const { passwordHash, ...safeUser } = user
    return safeUser
}

function issueToken(user) {
    return jwt.sign({ id: user.id, role: user.role, email: user.email }, jwtSecret, { expiresIn: '7d' })
}

async function findOrCreateOAuthUser(profile, provider) {
    const database = await connectDatabase()
    const users = database.collection('users')
    const email = profile.emails?.[0]?.value?.toLowerCase()
    if (!email) throw new Error(`Your ${provider} account did not provide an email address.`)
    let user = await users.findOne({ email })
    if (!user) {
        user = { id: `customer-${Date.now()}`, name: profile.displayName || profile.name?.givenName || 'AgroMart Customer', email, phone: '', role: 'customer', status: 'approved', authProvider: provider, providerId: profile.id, createdAt: new Date().toISOString() }
        await users.insertOne(user)
    }
    return user
}

function oauthRedirect(user, response) {
    const token = issueToken(user)
    const userData = encodeURIComponent(JSON.stringify(publicUser(user)))
    response.redirect(`${clientUrl}/?oauth_token=${encodeURIComponent(token)}&oauth_user=${userData}#/home`)
}

if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.startsWith('replace_')) {
    passport.use(new GoogleStrategy({ clientID: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, callbackURL: `${apiPublicUrl}/api/auth/google/callback` }, async (_accessToken, _refreshToken, profile, done) => {
        try { done(null, await findOrCreateOAuthUser(profile, 'google')) } catch (error) { done(error) }
    }))
}

if (process.env.FACEBOOK_APP_ID && !process.env.FACEBOOK_APP_ID.startsWith('replace_')) {
    passport.use(new FacebookStrategy({ clientID: process.env.FACEBOOK_APP_ID, clientSecret: process.env.FACEBOOK_APP_SECRET, callbackURL: `${apiPublicUrl}/api/auth/facebook/callback`, profileFields: ['id', 'displayName', 'emails', 'name'] }, async (_accessToken, _refreshToken, profile, done) => {
        try { done(null, await findOrCreateOAuthUser(profile, 'facebook')) } catch (error) { done(error) }
    }))
}

async function ensureAdminUser() {
    const database = await connectDatabase()
    const users = database.collection('users')
    const existing = await users.findOne({ role: 'admin' })
    if (existing) {
        const passwordMatches = existing.passwordHash && await bcrypt.compare(adminPassword, existing.passwordHash)
        const updates = { name: adminName, email: adminEmail }
        if (!passwordMatches) updates.passwordHash = await bcrypt.hash(adminPassword, 12)
        if (existing.name !== adminName || existing.email !== adminEmail || !passwordMatches) {
            await users.updateOne({ id: existing.id }, { $set: updates })
            return { ...existing, ...updates }
        }
        return existing
    }
    const admin = { id: 'admin-1', name: adminName, email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), role: 'admin', status: 'approved' }
    await users.insertOne(admin)
    return admin
}

async function migrateLegacyData() {
    if (!existsSync(legacyDataPath)) return
    const database = await connectDatabase()
    const legacy = JSON.parse(readFileSync(legacyDataPath, 'utf8'))
    for (const [collectionName, items] of Object.entries({ products: legacy.products, orders: legacy.orders, users: legacy.users })) {
        if (!Array.isArray(items) || !items.length) continue
        const collection = database.collection(collectionName)
        if (await collection.countDocuments() === 0) await collection.insertMany(items, { ordered: false })
    }
}

app.post('/api/auth/register', async (request, response) => {
    try {
        const { name, email, password, phone } = request.body
        const normalizedEmail = String(email || '').trim().toLowerCase()
        if (!name || !normalizedEmail || !password || String(password).length < 6) return response.status(400).json({ error: 'Name, email, and a password of at least 6 characters are required.' })
        const database = await connectDatabase()
        const users = database.collection('users')
        const user = { id: `customer-${Date.now()}`, name: String(name).trim(), email: normalizedEmail, phone: String(phone || '').trim(), passwordHash: await bcrypt.hash(String(password), 12), role: 'customer', status: 'approved', createdAt: new Date().toISOString() }
        if (await users.findOne({ email: normalizedEmail })) return response.status(409).json({ error: 'This email is already registered.' })
        await users.insertOne(user)
        response.status(201).json({ user: publicUser(user), token: issueToken(user) })
    } catch (error) {
        console.error('Registration failed:', error)
        response.status(500).json({ error: 'Registration failed. Check MongoDB Atlas access and database permissions.' })
    }
})

app.post('/api/auth/login', async (request, response) => {
    await ensureAdminUser()
    const email = String(request.body.email || '').trim().toLowerCase()
    const password = String(request.body.password || '')
    const database = await connectDatabase()
    const user = await database.collection('users').findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return response.status(401).json({ error: 'Email or password is incorrect.' })
    if (!['customer', 'admin'].includes(user.role)) return response.status(403).json({ error: 'This account type is no longer available.' })
    response.json({ user: publicUser(user), token: issueToken(user) })
})

app.post('/api/auth/reset-password', async (request, response) => {
    const email = String(request.body.email || '').trim().toLowerCase()
    const password = String(request.body.password || '')
    if (password.length < 6) return response.status(400).json({ error: 'Password must be at least 6 characters.' })
    const database = await connectDatabase()
    const users = database.collection('users')
    const user = await users.findOne({ email })
    if (!user) return response.status(404).json({ error: 'No account was found with this email address.' })
    await users.updateOne({ _id: user._id }, { $set: { passwordHash: await bcrypt.hash(password, 12) } })
    response.json({ message: 'Password updated successfully.' })
})

app.get('/api/auth/google', (request, response, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('replace_')) return response.status(503).json({ error: 'Google login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.' })
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(request, response, next)
})

app.get('/api/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${clientUrl}/#/login` }), (request, response) => oauthRedirect(request.user, response))

app.get('/api/auth/facebook', (request, response, next) => {
    if (!process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID.startsWith('replace_')) return response.status(503).json({ error: 'Facebook login is not configured. Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to .env.' })
    passport.authenticate('facebook', { scope: ['email'], session: false })(request, response, next)
})

app.get('/api/auth/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: `${clientUrl}/#/login` }), (request, response) => oauthRedirect(request.user, response))

app.get('/api/products', async (_request, response) => {
    const database = await connectDatabase()
    response.json(await database.collection('products').find({}).sort({ createdAt: -1 }).toArray())
})

app.post('/api/products', async (request, response) => {
    const database = await connectDatabase()
    const product = { ...request.body, id: request.body.id || `product-${Date.now()}`, createdAt: new Date().toISOString() }
    await database.collection('products').insertOne(product)
    response.status(201).json(product)
})

app.put('/api/products/:id', async (request, response) => {
    const database = await connectDatabase()
    const result = await database.collection('products').findOneAndUpdate({ id: request.params.id }, { $set: request.body }, { returnDocument: 'after' })
    if (!result) return response.status(404).json({ error: 'Product not found' })
    response.json(result)
})

app.delete('/api/products/:id', async (request, response) => {
    const database = await connectDatabase()
    const result = await database.collection('products').deleteOne({ id: request.params.id })
    if (!result.deletedCount) return response.status(404).json({ error: 'Product not found' })
    response.status(204).end()
})

app.get('/api/orders', async (_request, response) => {
    const database = await connectDatabase()
    response.json(await database.collection('orders').find({}).sort({ createdAt: -1 }).toArray())
})

app.post('/api/orders', async (request, response) => {
    const database = await connectDatabase()
    const order = { ...request.body, id: request.body.id || `order-${Date.now()}`, createdAt: new Date().toISOString() }
    await database.collection('orders').insertOne(order)
    response.status(201).json(order)
})

async function startServer() {
    await connectDatabase()
    await migrateLegacyData()
    await ensureAdminUser()
    app.listen(port, () => console.log(`AgroMart API running at http://localhost:${port}`))
}

export { app }

if (process.env.VERCEL !== '1') {
    startServer().catch((error) => {
        console.error('Unable to start AgroMart API. Is MongoDB running?', error.message)
        process.exit(1)
    })
}
