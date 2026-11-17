import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { rateLimit } from 'express-rate-limit'
import User from '../models/User.js'
import requireDatabase from '../middleware/requireDatabase.js'

const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const resetRequestLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5 })
const resetConfirmLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15 })
const resetResponse = 'If an account exists for that email, a password reset code will be sent.'
const resetCodeLifetime = 10 * 60 * 1000

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

function getMailConfiguration() {
    const host = process.env.SMTP_HOST || (process.env.RESEND_API_KEY ? 'smtp.resend.com' : '')
    const user = process.env.SMTP_USER || (process.env.RESEND_API_KEY ? 'resend' : '')
    const password = process.env.SMTP_PASS || process.env.RESEND_API_KEY
    const from = process.env.SMTP_FROM
    if (!host || !user || !password || !from) return null

    const port = Number(process.env.SMTP_PORT || 465)
    if (!Number.isInteger(port) || port < 1 || port > 65535) return null
    const secure = process.env.SMTP_SECURE === undefined ? port === 465 : process.env.SMTP_SECURE === 'true'

    return {
        from,
        transporter: nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass: password }
        })
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character])
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

router.post('/password-reset/request', resetRequestLimit, async (request, response, next) => {
    try {
        const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
        if (!emailPattern.test(email) || email.length > 254) {
            return response.status(400).json({ error: 'Provide a valid email address.' })
        }

        const mail = getMailConfiguration()
        if (!mail) {
            return response.status(503).json({ error: 'Password recovery email is not configured on this server.' })
        }

        const user = await User.findOne({ email })
        if (user) {
            const code = String(randomInt(100000, 1000000))
            const codeHash = createHmac('sha256', process.env.JWT_SECRET).update(`${email}:${code}`).digest('hex')
            await User.issuePasswordResetCode(user.id, codeHash, Date.now() + resetCodeLifetime)
            try {
                await mail.transporter.sendMail({
                    from: mail.from,
                    to: user.email,
                    subject: 'Your AgroMart password reset code',
                    text: `Hello ${user.name},\n\nYour AgroMart password reset code is ${code}. It expires in 10 minutes and can be used once.\n\nIf you did not request this, you can ignore this email.`,
                    html: `<p>Hello ${escapeHtml(user.name)},</p><p>Your AgroMart password reset code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes and can be used once.</p><p>If you did not request this, you can ignore this email.</p>`
                })
            } catch (error) {
                await User.deletePasswordResetCode(user.id, codeHash)
                console.error('Unable to send password reset code email:', error)
                return response.status(502).json({ error: 'Unable to send the reset code email. Please try again later.' })
            }
        }
        return response.json({ message: resetResponse })
    } catch (error) {
        return next(error)
    }
})

router.post('/password-reset/confirm', resetConfirmLimit, async (request, response, next) => {
    try {
        const { code, confirmPassword, password } = request.body || {}
        const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
        if (!emailPattern.test(email) || email.length > 254 || typeof code !== 'string' || !/^\d{6}$/.test(code) || typeof password !== 'string' || password.length < 8 || password.length > 128 || password !== confirmPassword) {
            return response.status(400).json({ error: 'Enter the 6-digit code and matching passwords (8 to 128 characters).' })
        }

        const codeHash = createHmac('sha256', process.env.JWT_SECRET).update(`${email}:${code}`).digest('hex')
        const passwordHash = await bcrypt.hash(password, 12)
        const result = await User.resetPasswordWithCode(email, codeHash, passwordHash)
        if (result !== 'updated') return response.status(400).json({ error: 'The reset code is invalid, expired, or has reached its attempt limit.' })
        return response.json({ message: 'Your password has been reset. You can now sign in.' })
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
