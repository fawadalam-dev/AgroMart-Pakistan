import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import requireDatabase from '../middleware/requireDatabase.js'
import { query } from '../db/database.js'

const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const verificationLifetimeMs = 10 * 60 * 1000
const verificationResendDelayMs = 60 * 1000
const maxVerificationAttempts = 5

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

function httpError(statusCode, message) {
    const error = new Error(message)
    error.statusCode = statusCode
    error.publicMessage = message
    return error
}

function hashVerificationCode(email, code) {
    return createHmac('sha256', process.env.JWT_SECRET)
        .update(`${email}:${code}`)
        .digest('hex')
}

async function sendVerificationCode(email, profile = null) {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        throw httpError(503, 'Email verification is not configured. Please contact the administrator.')
    }

    const { rows } = await query('SELECT * FROM email_verifications WHERE email = $1 LIMIT 1', [email])
    const existing = rows[0]
    if (existing && Date.now() - new Date(existing.last_sent_at).getTime() < verificationResendDelayMs) {
        return false
    }

    const code = String(randomInt(0, 1000000)).padStart(6, '0')
    let response
    try {
        response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM,
                to: [email],
                subject: 'Your AgroMart verification code',
                text: `Your AgroMart verification code is ${code}. It expires in 10 minutes.`,
                html: `<p>Your AgroMart verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`
            })
        })
    } catch (error) {
        console.error('Email verification delivery failed:', error.message)
        throw httpError(503, 'The verification email could not be sent. Please try again later.')
    }
    if (!response.ok) {
        console.error(`Email verification delivery failed with HTTP ${response.status}.`)
        throw httpError(503, 'The verification email could not be sent. Check the email service configuration.')
    }

    const now = new Date()
    const registration = profile || (existing?.password_hash ? {
        name: existing.name,
        phone: existing.phone,
        passwordHash: existing.password_hash
    } : {})
    await query(`
        INSERT INTO email_verifications (
            email, code_hash, name, phone, password_hash, attempts, expires_at, last_sent_at
        ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
            code_hash = $2, name = $3, phone = $4, password_hash = $5,
            attempts = 0, expires_at = $6, last_sent_at = $7
    `, [
        email,
        hashVerificationCode(email, code),
        registration.name || null,
        registration.phone || null,
        registration.passwordHash || null,
        new Date(now.getTime() + verificationLifetimeMs).toISOString(),
        now.toISOString()
    ])
    return true
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

        const passwordHash = await bcrypt.hash(password, 12)
        const codeSent = await sendVerificationCode(cleanEmail, { name: cleanName, phone: cleanPhone, passwordHash })
        return response.status(202).json({
            verificationRequired: true,
            email: cleanEmail,
            message: codeSent
                ? 'A verification code has been sent to your email address.'
                : 'A code was already sent recently. Check your email before requesting another.'
        })
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
        if (!user.emailVerified) {
            const codeSent = await sendVerificationCode(email, {
                name: user.name,
                phone: user.phone,
                passwordHash: user.passwordHash
            })
            return response.status(403).json({
                verificationRequired: true,
                email,
                error: codeSent
                    ? 'Verify your email address with the code we sent before signing in.'
                    : 'A verification code was already sent recently. Check your email.'
            })
        }
        return respondWithUser(response, user)
    } catch (error) {
        return next(error)
    }
})

router.post('/verify-email', async (request, response, next) => {
    try {
        const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
        const code = typeof request.body?.code === 'string' ? request.body.code.trim() : ''
        if (!emailPattern.test(email) || !/^\d{6}$/.test(code)) {
            return response.status(400).json({ error: 'Enter the email address and its 6-digit verification code.' })
        }

        const { rows } = await query('SELECT * FROM email_verifications WHERE email = $1 LIMIT 1', [email])
        const challenge = rows[0]
        if (!challenge) return response.status(400).json({ error: 'No active verification code was found. Request a new one.' })
        if (new Date(challenge.expires_at).getTime() <= Date.now()) {
            await query('DELETE FROM email_verifications WHERE email = $1', [email])
            return response.status(400).json({ error: 'This verification code has expired. Request a new one.' })
        }
        if (challenge.attempts >= maxVerificationAttempts) {
            return response.status(429).json({ error: 'Too many incorrect codes. Request a new verification code.' })
        }

        const expected = Buffer.from(challenge.code_hash, 'hex')
        const actual = Buffer.from(hashVerificationCode(email, code), 'hex')
        if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
            await query('UPDATE email_verifications SET attempts = attempts + 1 WHERE email = $1', [email])
            return response.status(400).json({ error: 'The verification code is incorrect.' })
        }

        let user = await User.findOne({ email })
        if (!user && challenge.password_hash) {
            user = await User.create({
                name: challenge.name,
                email,
                phone: challenge.phone,
                passwordHash: challenge.password_hash,
                role: 'user',
                emailVerified: true
            })
        } else if (user) {
            await query('UPDATE users SET email_verified = TRUE, updated_at = $2 WHERE id = $1', [user.id, new Date().toISOString()])
            user.emailVerified = true
        } else {
            await query('DELETE FROM email_verifications WHERE email = $1', [email])
            return response.status(400).json({ error: 'This verification request is no longer valid. Register again.' })
        }
        await query('DELETE FROM email_verifications WHERE email = $1', [email])
        return respondWithUser(response, user, 200)
    } catch (error) {
        return next(error)
    }
})

router.post('/resend-verification', async (request, response, next) => {
    try {
        const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
        if (!emailPattern.test(email)) return response.status(400).json({ error: 'Enter a valid email address.' })
        const { rows } = await query('SELECT * FROM email_verifications WHERE email = $1 LIMIT 1', [email])
        if (!rows[0]) {
            return response.json({ message: 'If this address has a pending verification, a new code will be sent.' })
        }
        const codeSent = await sendVerificationCode(email)
        if (!codeSent) throw httpError(429, 'Please wait one minute before requesting another verification code.')
        return response.json({ message: 'A new verification code has been sent.' })
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
            role: 'admin',
            emailVerified: true
        })
        return respondWithUser(response, user, 201)
    } catch (error) {
        return next(error)
    }
})

export default router
