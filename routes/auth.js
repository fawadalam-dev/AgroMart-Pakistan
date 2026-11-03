import { timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import requireDatabase from '../middleware/requireDatabase.js'

const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.use(requireDatabase)

function isValidSetupKey(candidate, configured) {
    if (!candidate || !configured) return false
    const candidateBuffer = Buffer.from(String(candidate))
    const configuredBuffer = Buffer.from(configured)
    return candidateBuffer.length === configuredBuffer.length && timingSafeEqual(candidateBuffer, configuredBuffer)
}

function createToken(user) {
    return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function respondWithUser(response, user, status = 200) {
    return response.status(status).json({ token: createToken(user), user: user.toJSON() })
}

router.post('/register', async (request, response, next) => {
    try {
        const { name, email, phone, password } = request.body || {}
        const cleanName = typeof name === 'string' ? name.trim() : ''
        const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
        const cleanPhone = typeof phone === 'string' ? phone.trim() : ''
        if (!cleanName || cleanName.length > 100 || !emailPattern.test(cleanEmail) || cleanEmail.length > 254 || !cleanPhone || cleanPhone.length > 40 || typeof password !== 'string' || password.length < 6 || password.length > 128) {
            return response.status(400).json({ error: 'Provide a valid name, email, phone number, and password of 6 to 128 characters.' })
        }

        const existingUser = await User.exists({ email: cleanEmail })
        if (existingUser) return response.status(409).json({ error: 'This email is already registered.' })

        const user = await User.create({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            passwordHash: await bcrypt.hash(password, 12),
            role: 'user'
        })
        return respondWithUser(response, user, 201)
    } catch (error) {
        return next(error)
    }
})

router.post('/login', async (request, response, next) => {
    try {
        const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
        const password = typeof request.body?.password === 'string' ? request.body.password : ''
        const user = await User.findOne({ email })
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return response.status(401).json({ error: 'Email or password is incorrect.' })
        }
        return respondWithUser(response, user)
    } catch (error) {
        return next(error)
    }
})

router.post('/admin-setup', async (request, response, next) => {
    try {
        if (!process.env.ADMIN_SETUP_KEY) {
            return response.status(503).json({ error: 'Administrator setup is not enabled on this server.' })
        }
        const { name, email, phone, password, setupKey } = request.body || {}
        if (!isValidSetupKey(setupKey, process.env.ADMIN_SETUP_KEY)) {
            return response.status(403).json({ error: 'Administrator setup key is invalid.' })
        }
        if (await User.exists({ role: 'admin' })) {
            return response.status(409).json({ error: 'An administrator account has already been created.' })
        }

        const cleanName = typeof name === 'string' ? name.trim() : ''
        const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
        const cleanPhone = typeof phone === 'string' ? phone.trim() : ''
        if (!cleanName || cleanName.length > 100 || !emailPattern.test(cleanEmail) || cleanEmail.length > 254 || !cleanPhone || cleanPhone.length > 40 || typeof password !== 'string' || password.length < 12 || password.length > 128) {
            return response.status(400).json({ error: 'Provide valid account details and an administrator password of 12 to 128 characters.' })
        }
        if (await User.exists({ email: cleanEmail })) {
            return response.status(409).json({ error: 'This email is already registered.' })
        }

        const user = await User.create({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            passwordHash: await bcrypt.hash(password, 12),
            role: 'admin'
        })
        return respondWithUser(response, user, 201)
    } catch (error) {
        return next(error)
    }
})

export default router
