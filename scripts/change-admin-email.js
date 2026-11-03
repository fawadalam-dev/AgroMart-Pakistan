import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { closeDatabase, connectDatabase, query } from '../db/database.js'

export async function changeAdminEmail(currentEmail, newEmail) {
    const cleanCurrentEmail = currentEmail.trim().toLowerCase()
    const cleanNewEmail = newEmail.trim().toLowerCase()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(cleanCurrentEmail) || !emailPattern.test(cleanNewEmail)) {
        throw new Error('Enter valid current and new email addresses.')
    }

    const { rows } = await query("SELECT id FROM users WHERE LOWER(email) = $1 AND role = 'admin'", [cleanCurrentEmail])
    const admin = rows[0]
    if (!admin) throw new Error('No admin account exists with the current email address.')

    const existingResult = await query('SELECT 1 FROM users WHERE LOWER(email) = $1 AND id != $2', [cleanNewEmail, admin.id])
    const existing = existingResult.rows[0]
    if (existing) throw new Error('That email address is already in use.')

    const result = await query(`
        UPDATE users SET email = $1, updated_at = $2 WHERE id = $3 AND role = 'admin'
    `, [cleanNewEmail, new Date().toISOString(), admin.id])
    if (result.rowCount !== 1) throw new Error('Admin email was not updated.')
}

async function main() {
    const terminal = createInterface({ input: process.stdin, output: process.stdout })
    let currentEmail
    let newEmail
    try {
        currentEmail = await terminal.question('Current admin email: ')
        newEmail = await terminal.question('New admin email: ')
    } finally {
        terminal.close()
    }

    await connectDatabase()
    try {
        await changeAdminEmail(currentEmail, newEmail)
        console.log(`Admin email updated to ${newEmail.trim().toLowerCase()}.`)
    } finally {
        await closeDatabase()
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(`Admin email change failed: ${error.message}`)
        process.exitCode = 1
    })
}
