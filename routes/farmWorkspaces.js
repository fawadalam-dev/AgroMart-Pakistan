import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/authenticate.js'
import requireDatabase from '../middleware/requireDatabase.js'
import FarmWorkspace from '../models/FarmWorkspace.js'

const router = Router()
const workspaceCollections = ['farmers', 'lands', 'crops', 'transactions']
const maxWorkspaceSize = 8 * 1024 * 1024
const maxRecordsPerCollection = 5000

router.use(requireDatabase, authenticate)

function validateWorkspace(workspace) {
    if (!workspace || typeof workspace !== 'object' || Array.isArray(workspace)) {
        return 'Farm dashboard data must be an object.'
    }
    if (workspaceCollections.some((key) => !Array.isArray(workspace[key]))) {
        return 'Farm dashboard must include farmers, lands, crops, and transactions.'
    }
    if (workspaceCollections.some((key) =>
        workspace[key].length > maxRecordsPerCollection
        || workspace[key].some((record) => !record || typeof record !== 'object' || Array.isArray(record))
    )) {
        return 'Farm dashboard contains too many or invalid records.'
    }
    if (Buffer.byteLength(JSON.stringify(workspace), 'utf8') > maxWorkspaceSize) {
        return 'Farm dashboard data must be smaller than 8 MB.'
    }
    return ''
}

router.get('/admin', requireAdmin, async (_request, response, next) => {
    try {
        const workspaces = await FarmWorkspace.findAll()
        return response.json({ workspaces })
    } catch (error) {
        return next(error)
    }
})

router.get('/', async (request, response, next) => {
    try {
        const workspace = await FarmWorkspace.findByOwnerId(request.user.id)
        return response.json({ workspace })
    } catch (error) {
        return next(error)
    }
})

router.put('/', async (request, response, next) => {
    try {
        if (request.user.role === 'admin') {
            return response.status(403).json({ error: 'Administrator accounts cannot save farmer dashboard data.' })
        }
        const workspace = request.body?.workspace
        const error = validateWorkspace(workspace)
        if (error) return response.status(400).json({ error })
        await FarmWorkspace.save(request.user.id, workspace)
        return response.json({ workspace })
    } catch (error) {
        return next(error)
    }
})

export default router
