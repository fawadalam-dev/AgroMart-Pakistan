import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
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
const resetResponse = 'If an account exists for that email, a password reset link will be sent.'
const resetTokenLifetime = 30 * 60 * 1000

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
    const appUrlValue = process.env.APP_URL
    if (!host || !user || !password || !from || !appUrlValue) return null

    const port = Number(process.env.SMTP_PORT || 465)
    if (!Number.isInteger(port) || port < 1 || port > 65535) return null
    const secure = process.env.SMTP_SECURE === undefined ? port === 465 : process.env.SMTP_SECURE === 'true'
    let appUrl
    try {
        appUrl = new URL(appUrlValue)
    } catch {
        return null
    }
    if (!['http:', 'https:'].includes(appUrl.protocol)) return null
    appUrl.search = ''
    appUrl.hash = ''

    return {
        from,
        appUrl,
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
            const token = randomBytes(32).toString('hex')
            const tokenHash = createHash('sha256').update(token).digest('hex')
            await User.issuePasswordResetToken(user.id, tokenHash, Date.now() + resetTokenLifetime)

            const resetUrl = new URL(mail.appUrl)
            resetUrl.hash = `/reset-password/${token}`
            try {
                await mail.transporter.sendMail({
                    from: mail.from,
                    to: user.email,
                    subject: 'Reset your AgroMart password',
                    text: `Hello ${user.name},\n\nUse this link within 30 minutes to reset your AgroMart password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
                    html: `<p>Hello ${escapeHtml(user.name)},</p><p>Use this link within 30 minutes to reset your AgroMart password:</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`
                })
            } catch (error) {
                await User.deletePasswordResetToken(user.id, tokenHash)
                console.error('Unable to send password reset email:', error)
            }
        }
        return response.json({ message: resetResponse })
    } catch (error) {
        return next(error)
    }
})

router.post('/password-reset/confirm', async (request, response, next) => {
    try {
        const { token, password } = request.body || {}
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof password !== 'string' || password.length < 8 || password.length > 128) {
            return response.status(400).json({ error: 'Provide a valid reset link and a password of 8 to 128 characters.' })
        }

        const tokenHash = createHash('sha256').update(token).digest('hex')
        const passwordHash = await bcrypt.hash(password, 12)
        const updated = await User.consumePasswordResetToken(tokenHash, passwordHash)
        if (!updated) return response.status(400).json({ error: 'This password reset link is invalid or has expired.' })
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
