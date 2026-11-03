import { randomBytes } from 'node:crypto'
import { query } from '../db/database.js'

function decodeJson(value) {
    if (typeof value !== 'string') return value
    return JSON.parse(value)
}

function toOrder(record) {
    return {
        id: record.id,
        clientOrderId: record.client_order_id,
        ownerId: record.owner_user_id,
        ownerEmail: record.owner_email,
        ownerName: record.owner_name,
        customer: decodeJson(record.customer),
        items: decodeJson(record.items),
        itemDetails: decodeJson(record.item_details),
        total: Number(record.total),
        status: record.status,
        paymentMethod: record.payment_method,
        paymentStatus: record.payment_status,
        createdAt: new Date(record.created_at).getTime(),
        date: new Date(record.created_at).toISOString()
    }
}

class Order {
    static async findForUser(user) {
        const isAdmin = user.role === 'admin'
        const result = isAdmin
            ? await query('SELECT * FROM orders ORDER BY created_at DESC')
            : await query('SELECT * FROM orders WHERE owner_user_id = $1 ORDER BY created_at DESC', [user.id])
        return result.rows.map(toOrder)
    }

    static async findByClientId(userId, clientOrderId) {
        const result = await query(
            'SELECT * FROM orders WHERE owner_user_id = $1 AND client_order_id = $2',
            [userId, clientOrderId]
        )
        return result.rows[0] ? toOrder(result.rows[0]) : null
    }

    static async create({ user, clientOrderId, customer, items, itemDetails, total }) {
        const existing = await Order.findByClientId(user.id, clientOrderId)
        if (existing) return existing

        const id = `AM-${randomBytes(8).toString('hex').toUpperCase()}`
        const now = new Date().toISOString()
        try {
            await query(`
                INSERT INTO orders (
                    id, client_order_id, owner_user_id, owner_email, owner_name,
                    customer, items, item_details, total, status, payment_method,
                    payment_status, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb,
                    $9, 'Processing', 'cod', 'Pay on delivery', $10, $10
                )
            `, [
                id,
                clientOrderId,
                user.id,
                user.email,
                user.name,
                JSON.stringify(customer),
                JSON.stringify(items),
                JSON.stringify(itemDetails),
                total,
                now
            ])
        } catch (error) {
            if (error.code !== '23505' && error.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw error
            const duplicate = await Order.findByClientId(user.id, clientOrderId)
            if (duplicate) return duplicate
            throw error
        }

        return Order.findByClientId(user.id, clientOrderId)
    }

    static async cancelForUser(id, user) {
        const cancelDeadline = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        const result = await query(`
            UPDATE orders
            SET status = 'Cancelled', updated_at = $1
            WHERE id = $2 AND owner_user_id = $3 AND status = 'Processing'
              AND created_at >= $4
        `, [new Date().toISOString(), id, user.id, cancelDeadline])
        if (result.rowCount) {
            const refreshed = await query('SELECT * FROM orders WHERE id = $1', [id])
            return refreshed.rows[0] ? toOrder(refreshed.rows[0]) : null
        }
        return null
    }

    static async updateStatus(id, status) {
        const result = await query(
            `UPDATE orders SET status = $1, updated_at = $2
             WHERE id = $3 AND status = $4`,
            [status, new Date().toISOString(), id, status === 'Shipped' ? 'Processing' : 'Shipped']
        )
        if (!result.rowCount) return null
        const refreshed = await query('SELECT * FROM orders WHERE id = $1', [id])
        return refreshed.rows[0] ? toOrder(refreshed.rows[0]) : null
    }
}

export default Order
