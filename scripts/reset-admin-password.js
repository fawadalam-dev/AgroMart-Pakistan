import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { createInterface } from 'node:readline/promises'
import bcrypt from 'bcryptjs'
import { closeDatabase, connectDatabase, query } from '../db/database.js'

export async function resetAdminPassword(email, password) {
    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new Error('Enter a valid admin email address.')
    }
    if (typeof password !== 'string' || Array.from(password).length < 8 || Buffer.byteLength(password, 'utf8') > 18) {
        throw new Error('New password must be at least 8 characters and no more than 18 UTF-8 bytes.')
    }

    const { rows } = await query("SELECT id FROM users WHERE LOWER(email) = $1 AND role = 'admin'", [cleanEmail])
    const admin = rows[0]
    if (!admin) throw new Error('No admin account exists with that email address.')

    const passwordHash = await bcrypt.hash(password, 12)
    const result = await query(`
        UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3 AND role = 'admin'
    `, [passwordHash, new Date().toISOString(), admin.id])
    if (result.rowCount !== 1) throw new Error('Admin password was not updated.')
}

function readHidden(prompt) {
    const input = process.stdin
    if (!input.isTTY || typeof input.setRawMode !== 'function') {
        throw new Error('Run this command in an interactive terminal so the password can be entered securely.')
    }

    return new Promise((resolve, reject) => {
        let value = ''
        process.stdout.write(prompt)
        input.setEncoding('utf8')
        input.setRawMode(true)
        input.resume()

        const finish = (error) => {
            input.removeListener('data', onData)
            input.setRawMode(false)
            input.pause()
            process.stdout.write('\n')
            if (error) reject(error)
            else resolve(value)
        }

        const onData = (chunk) => {
            for (const character of chunk) {
                if (character === '\u0003' || character === '\u0004') {
                    finish(new Error('Password reset cancelled.'))
                    return
                }
                if (character === '\r' || character === '\n') {
                    finish()
                    return
                }
                if (character === '\u0008' || character === '\u007f') {
                    if (value) {
                        value = Array.from(value).slice(0, -1).join('')
                        process.stdout.write('\b \b')
                    }
                    continue
                }
                if (character >= ' ') {
                    value += character
                    process.stdout.write('*')
                }
            }
        }

        input.on('data', onData)
    })
}

async function main() {
    let database
    const terminal = createInterface({ input: process.stdin, output: process.stdout })
    let email
    try {
        email = await terminal.question('Admin email: ')
    } finally {
        terminal.close()
    }

    const password = await readHidden('New password (input hidden): ')
    const confirmation = await readHidden('Confirm new password: ')
    if (password !== confirmation) throw new Error('Passwords do not match.')

    await connectDatabase()
    try {
        await resetAdminPassword(email, password)
        console.log(`Password updated for admin ${email.trim()}. You can now sign in with the new password.`)
    } finally {
        await closeDatabase()
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(`Admin password reset failed: ${error.message}`)
        process.exitCode = 1
    })
}
