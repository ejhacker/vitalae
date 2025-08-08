const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true,
        unique: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['medical_report', 'ecg_data', 'lab_results', 'prescription', 'image', 'document', 'other'],
        default: 'other'
    },
    description: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    isEncrypted: {
        type: Boolean,
        default: false
    },
    checksum: {
        type: String
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Index for efficient queries
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ category: 1 });
fileSchema.index({ filename: 1 });

module.exports = mongoose.model('File', fileSchema);
