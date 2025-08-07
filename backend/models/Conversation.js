const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
        enum: ['user', 'bot']
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    intent: {
        type: String,
        enum: ['product_inquiry', 'order_status', 'stock_check', 'general']
    }
});

const conversationSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        default: 'anonymous'
    },
    messages: [messageSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
});

// Update lastActivity on save
conversationSchema.pre('save', function(next) {
    this.lastActivity = new Date();
    next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
