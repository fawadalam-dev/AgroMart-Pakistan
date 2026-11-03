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

function productValues(product) {
    return [
        product.id,
        product.status,
        product.name,
        product.category,
        JSON.stringify(product.sections),
        product.price,
        product.stock,
        product.packSize,
        product.unit,
        product.details,
        product.usage,
        product.image,
        JSON.stringify(product.images),
        product.badge,
        product.rating,
        product.reviews,
        product.createdAt,
        product.updatedAt,
        JSON.stringify(product)
    ]
}

function parseArray(value) {
    if (Array.isArray(value)) return value
    if (typeof value !== 'string') return []
    return JSON.parse(value)
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

    static async findHiddenIds() {
        const { rows } = await query('SELECT id FROM hidden_products')
        return rows.map((row) => row.id)
    }

    static async hideById(id) {
        await query(
            'INSERT INTO hidden_products (id, created_at) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
            [id, new Date().toISOString()]
        )
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
            INSERT INTO products (
                id, status, name, category, sections, price, stock, pack_size, unit,
                details, usage, image, images, badge, rating, reviews, created_at, updated_at,
                data_json
            ) VALUES (
                $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9,
                $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18, $19
            )
        `, productValues(record))
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
            UPDATE products SET
                status = $2, name = $3, category = $4, sections = $5::jsonb, price = $6,
                stock = $7, pack_size = $8, unit = $9, details = $10, usage = $11,
                image = $12, images = $13::jsonb, badge = $14, rating = $15,
                reviews = $16, updated_at = $17, data_json = $18
            WHERE id = $1
        `, [
            ...productValues(record).slice(0, 16),
            record.updatedAt,
            JSON.stringify(record)
        ])
        return new Product(record)
    }

    static async deleteById(id) {
        await Product.hideById(id)
        const result = await query('DELETE FROM products WHERE id = $1', [id])
        return result.rowCount > 0
    }

    static fromRecord(record) {
        const legacyData = record.data_json ? JSON.parse(record.data_json) : {}
        return new Product({
            ...legacyData,
            id: record.id,
            status: record.status,
            name: record.name || legacyData.name || '',
            category: record.category || legacyData.category || '',
            sections: parseArray(record.sections ?? legacyData.sections),
            price: Number(record.price ?? legacyData.price ?? 0),
            stock: Number(record.stock ?? legacyData.stock ?? 0),
            packSize: Number(record.pack_size ?? legacyData.packSize ?? 0),
            unit: record.unit || legacyData.unit || 'piece',
            details: record.details ?? legacyData.details ?? '',
            usage: record.usage ?? legacyData.usage ?? '',
            image: record.image ?? legacyData.image ?? '',
            images: parseArray(record.images ?? legacyData.images),
            badge: record.badge ?? legacyData.badge ?? '',
            rating: record.rating ?? legacyData.rating ?? '4.8',
            reviews: Number(record.reviews ?? legacyData.reviews ?? 0),
            createdAt: record.created_at,
            updatedAt: record.updated_at
        })
    }
}

export default Product
