import { randomBytes } from 'node:crypto'
import { query } from '../db/database.js'

const defaults = {
    sections: [],
    packSize: 0,
    unit: 'piece',
    details: '',
    usage: '',
    image: '',
    images: [],
    badge: '',
    rating: '4.8',
    reviews: 0,
    status: 'approved'
}

function validateProduct(product) {
    const invalid = (message) => {
        const error = new Error(message)
        error.name = 'ValidationError'
        throw error
    }
    if (typeof product.name !== 'string' || !product.name.trim() || product.name.length > 160) invalid('Product name is invalid.')
    if (typeof product.category !== 'string' || !product.category.trim() || product.category.length > 80) invalid('Product category is invalid.')
    for (const field of ['price', 'stock', 'packSize', 'reviews']) {
        if (!Number.isFinite(product[field]) || product[field] < 0) invalid(`${field} must be a non-negative number.`)
    }
    if (!Array.isArray(product.sections) || !Array.isArray(product.images)) invalid('Product sections and images must be arrays.')
    if (typeof product.unit !== 'string' || product.unit.length > 30) invalid('Product unit is invalid.')
    if (typeof product.details !== 'string' || product.details.length > 5000) invalid('Product details are invalid.')
    if (typeof product.usage !== 'string' || product.usage.length > 5000) invalid('Product usage is invalid.')
    if (typeof product.image !== 'string' || product.image.length > 12000000) invalid('Product image is invalid.')
    if (product.images.some((image) => typeof image !== 'string')) invalid('Product images are invalid.')
    if (typeof product.badge !== 'string' || product.badge.length > 80) invalid('Product badge is invalid.')
    if (typeof product.rating !== 'string') invalid('Product rating is invalid.')
    if (!['pending', 'approved', 'rejected'].includes(product.status)) invalid('Product status is invalid.')
}

class Product {
    constructor(record) {
        Object.assign(this, record)
    }

    toJSON() {
        const result = { ...this }
        if (!result.image && result.images?.length) result.image = result.images[0]
        delete result.createdAt
        delete result.updatedAt
        return result
    }

    static async findAll(filter = {}) {
        const { rows } = filter.status
            ? await query('SELECT * FROM products WHERE status = $1 ORDER BY created_at DESC', [filter.status])
            : await query('SELECT * FROM products ORDER BY created_at DESC')
        return rows.map(Product.fromRecord)
    }

    static async findById(id, { status } = {}) {
        const { rows } = status
            ? await query('SELECT * FROM products WHERE id = $1 AND status = $2', [id, status])
            : await query('SELECT * FROM products WHERE id = $1', [id])
        const record = rows[0]
        return record ? Product.fromRecord(record) : null
    }

    static async create(values) {
        const id = randomBytes(12).toString('hex')
        const now = new Date().toISOString()
        const record = { ...defaults, ...values, id, createdAt: now, updatedAt: now }
        record.name = record.name.trim()
        record.category = record.category.trim()
        validateProduct(record)
        await query(`
            INSERT INTO products (id, status, data_json, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            record.id,
            record.status,
            JSON.stringify(record),
            record.createdAt,
            record.updatedAt
        ])
        return new Product(record)
    }

    static async updateById(id, values) {
        const current = await Product.findById(id)
        if (!current) return null
        const record = { ...current, ...values, updatedAt: new Date().toISOString() }
        if (values.name !== undefined) record.name = values.name.trim()
        if (values.category !== undefined) record.category = values.category.trim()
        validateProduct(record)
        await query(`
            UPDATE products SET status = $1, data_json = $2, updated_at = $3 WHERE id = $4
        `, [record.status, JSON.stringify(record), record.updatedAt, record.id])
        return new Product(record)
    }

    static async deleteById(id) {
        const result = await query('DELETE FROM products WHERE id = $1', [id])
        return result.rowCount > 0
    }

    static fromRecord(record) {
        return new Product({
            ...JSON.parse(record.data_json),
            id: record.id,
            status: record.status,
            createdAt: record.created_at,
            updatedAt: record.updated_at
        })
    }
}

export default Product
