import 'dotenv/config'
import app from './app.js'
import { connectDatabase, getDatabaseType } from './db/database.js'

const port = Number(process.env.PORT) || 3000

async function startServer() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.')
    }

    await connectDatabase()
    console.log(`${getDatabaseType()} database connected.`)
    app.listen(port, () => {
        console.log(`AgroMart API server listening on port ${port}`)
    })
}

startServer().catch((error) => {
    console.error(`Unable to start AgroMart API server: ${error.message}`)
    process.exitCode = 1
})
