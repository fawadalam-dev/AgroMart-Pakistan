import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true, versionKey: false })

userSchema.set('toJSON', {
    transform(_document, result) {
        result.id = result._id.toString()
        delete result._id
        delete result.passwordHash
        delete result.createdAt
        delete result.updatedAt
        return result
    }
})

export default mongoose.model('User', userSchema)
