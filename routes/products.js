import { Router } from 'express'
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { authenticate, requireAdmin } from '../middleware/authenticate.js'

const router = Router()

function productInput(body, { partial = false } = {}) {
    const input = {}
    const fields = ['name', 'category', 'sections', 'price', 'stock', 'packSize', 'unit', 'details', 'usage', 'image', 'images', 'badge', 'rating', 'reviews']
    for (const field of fields) {
        if (Object.hasOwn(body, field)) input[field] = body[field]
    }
    if (!partial && (!input.name || !input.category || input.price === undefined || input.stock === undefined)) {
        return { error: 'Name, category, price, and stock are required.' }
    }
    if (input.name !== undefined && (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160)) {
        return { error: 'Product name must be between 1 and 160 characters.' }
    }
    if (input.category !== undefined && (typeof input.category !== 'string' || !input.category.trim() || input.category.length > 80)) {
        return { error: 'Product category must be between 1 and 80 characters.' }
    }
    for (const field of ['price', 'stock', 'packSize', 'reviews']) {
        if (input[field] !== undefined && (!Number.isFinite(Number(input[field])) || Number(input[field]) < 0)) {
            return { error: `${field} must be a non-negative number.` }
        }
        if (input[field] !== undefined) input[field] = Number(input[field])
    }
    if (input.sections !== undefined && (!Array.isArray(input.sections) || input.sections.some((section) => typeof section !== 'string' || section.length > 40))) {
        return { error: 'Sections must be an array of short text values.' }
    }
    if (input.images !== undefined && (!Array.isArray(input.images) || input.images.some((image) => typeof image !== 'string'))) {
        return { error: 'Images must be an array of strings.' }
    }
    for (const field of ['unit', 'details', 'usage', 'image', 'badge', 'rating']) {
        if (input[field] !== undefined && typeof input[field] !== 'string') {
            return { error: `${field} must be text.` }
        }
    }
    const imageCharacters = (input.images || []).reduce((total, image) => total + image.length, 0)
        + (input.image && input.image !== input.images?.[0] ? input.image.length : 0)
    if (imageCharacters > 14000000) {
        return { error: 'Product images exceed the total 14 MB storage limit.' }
    }
    if (input.images?.length && input.image === input.images[0]) input.image = ''
    if (Object.hasOwn(body, 'status')) return { error: 'Product status can only be changed through the approval endpoint.' }
    return { input }
}

function validId(id) {
    return mongoose.isValidObjectId(id)
}

async function listProducts(filter, response, next) {
    try {
        const products = await Product.find(filter).sort({ createdAt: -1 })
        return response.json({ products })
    } catch (error) {
        return next(error)
    }
}

router.get('/', (request, response, next) => {
    if (request.query.status !== 'all') return listProducts({ status: 'approved' }, response, next)
    return authenticate(request, response, (error) => {
        if (error) return next(error)
        if (request.user?.role !== 'admin') {
            return response.status(403).json({ error: 'Administrator access is required.' })
        }
        return listProducts({}, response, next)
    })
})

router.post('/', authenticate, requireAdmin, async (request, response, next) => {
    try {
        const { input, error } = productInput(request.body || {})
        if (error) return response.status(400).json({ error })
        const product = await Product.create({ ...input, status: 'approved' })
        return response.status(201).json({ product })
    } catch (error) {
        return next(error)
    }
})

router.put('/:id', authenticate, requireAdmin, async (request, response, next) => {
    try {
        if (!validId(request.params.id)) return response.status(400).json({ error: 'Product ID is invalid.' })
        const { input, error } = productInput(request.body || {})
        if (error) return response.status(400).json({ error })
        const product = await Product.findByIdAndUpdate(request.params.id, input, { new: true, runValidators: true })
        if (!product) return response.status(404).json({ error: 'Product was not found.' })
        return response.json({ product })
    } catch (error) {
        return next(error)
    }
})

router.patch('/:id/status', authenticate, requireAdmin, async (request, response, next) => {
    try {
        if (!validId(request.params.id)) return response.status(400).json({ error: 'Product ID is invalid.' })
        const { status } = request.body || {}
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return response.status(400).json({ error: 'Status must be pending, approved, or rejected.' })
        }
        const product = await Product.findByIdAndUpdate(request.params.id, { status }, { new: true, runValidators: true })
        if (!product) return response.status(404).json({ error: 'Product was not found.' })
        return response.json({ product })
    } catch (error) {
        return next(error)
    }
})

router.delete('/:id', authenticate, requireAdmin, async (request, response, next) => {
    try {
        if (!validId(request.params.id)) return response.status(400).json({ error: 'Product ID is invalid.' })
        const product = await Product.findByIdAndDelete(request.params.id)
        if (!product) return response.status(404).json({ error: 'Product was not found.' })
        return response.status(204).end()
    } catch (error) {
        return next(error)
    }
})

export default router
