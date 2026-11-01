import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    sections: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    packSize: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: 'piece', maxlength: 30 },
    details: { type: String, default: '', maxlength: 5000 },
    usage: { type: String, default: '', maxlength: 5000 },
    image: { type: String, default: '', maxlength: 12000000 },
    images: { type: [String], default: [] },
    badge: { type: String, default: '', maxlength: 80 },
    rating: { type: String, default: '4.8' },
    reviews: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true, versionKey: false })

productSchema.set('toJSON', {
    transform(_document, result) {
        result.id = result._id.toString()
        if (!result.image && result.images?.length) result.image = result.images[0]
        delete result._id
        delete result.createdAt
        delete result.updatedAt
        return result
    }
})

export default mongoose.model('Product', productSchema)
