const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['health_summary', 'ecg_analysis', 'trend_analysis', 'medical_report', 'custom'],
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    data: {
        // Flexible data structure for different report types
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    metrics: {
        heartRate: {
            average: Number,
            min: Number,
            max: Number,
            trend: String
        },
        ecg: {
            abnormalities: [String],
            rhythm: String,
            quality: String
        },
        lactate: {
            average: Number,
            threshold: Number,
            trend: String
        },
        spo2: {
            average: Number,
            min: Number,
            max: Number,
            trend: String
        }
    },
    timeRange: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['draft', 'generated', 'reviewed', 'approved'],
        default: 'draft'
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    attachments: [{
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimeType: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for efficient queries
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ 'timeRange.start': -1, 'timeRange.end': -1 });

module.exports = mongoose.model('Report', reportSchema);
