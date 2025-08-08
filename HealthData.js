const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    heartRate: {
        type: Number,
        min: 30,
        max: 220
    },
    ecg: {
        type: Number,
        min: -5,
        max: 5
    },
    lactate: {
        type: Number,
        min: 0,
        max: 30
    },
    spo2: {
        type: Number,
        min: 70,
        max: 100
    },
    temperature: {
        type: Number,
        min: 30,
        max: 45
    },
    bloodPressure: {
        systolic: {
            type: Number,
            min: 70,
            max: 200
        },
        diastolic: {
            type: Number,
            min: 40,
            max: 130
        }
    },
    sessionId: {
        type: String,
        required: true
    },
    deviceId: {
        type: String
    },
    location: {
        type: String
    },
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Index for efficient queries
healthDataSchema.index({ userId: 1, timestamp: -1 });
healthDataSchema.index({ sessionId: 1 });
healthDataSchema.index({ timestamp: -1 });

module.exports = mongoose.model('HealthData', healthDataSchema);
