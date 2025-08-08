const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    age: {
        type: Number,
        required: true,
        min: 1,
        max: 120
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    weight: {
        type: Number,
        required: true,
        min: 20,
        max: 300
    },
    height: {
        type: Number,
        required: true,
        min: 100,
        max: 250
    },
    lifestyle: {
        type: String,
        enum: ['sedentary', 'active', 'moderate'],
        required: true
    },
    drinking: {
        type: String,
        enum: ['none', 'occasional', 'regular'],
        required: true
    },
    smoking: {
        type: String,
        enum: ['none', 'occasional', 'regular'],
        required: true
    },
    bpPatient: {
        type: String,
        enum: ['yes', 'no'],
        required: true
    },
    sugarPatient: {
        type: String,
        enum: ['yes', 'no'],
        required: true
    },
    bmi: {
        type: Number,
        default: function() {
            if (this.weight && this.height) {
                return (this.weight / Math.pow(this.height / 100, 2)).toFixed(1);
            }
            return null;
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
