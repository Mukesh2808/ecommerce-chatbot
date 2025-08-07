const Product = require('../models/Product');
const Order = require('../models/Order');
const LLMService = require('./llmService');

class ChatService {
    static async processMessage(message, conversationHistory = []) {
        try {
            // First check if this is a simple query that can be handled directly
            const quickResponse = await this.tryQuickResponse(message);
            if (quickResponse) {
                return quickResponse;
            }

            // For complex queries, use LLM with business logic
            return await LLMService.processWithLLM(message, conversationHistory);
            
        } catch (error) {
            console.error('ChatService Error:', error);
            return "I apologize, but I'm experiencing some technical difficulties. Please try again or contact our support team.";
        }
    }

    static async tryQuickResponse(message) {
        const lowerMessage = message.toLowerCase().trim();
        
        // Handle very specific, simple queries directly for speed
        if (lowerMessage === 'hello' || lowerMessage === 'hi' || lowerMessage === 'hey') {
            return "👋 Hello! I'm here to help you with your e-commerce needs. You can ask me about:\n\n• 🏆 Top selling products\n• 📦 Order status tracking\n• 📊 Product stock levels\n• 🔍 Product searches\n\nWhat can I help you with today?";
        }

        if (lowerMessage.includes('help') && lowerMessage.length < 10) {
            return "I'm here to help! I can assist you with:\n\n• **Product Information** - Find products, check availability, get details\n• **Order Tracking** - Check order status with your order ID\n• **Stock Inquiries** - See how many items are available\n• **Recommendations** - Get our top-selling products\n\nJust ask me anything about our products or your orders! 😊";
        }

        // Return null to indicate LLM should handle this
        return null;
    }

    static async getTopProducts(limit = 5) {
        try {
            const topProducts = await Product.find()
                .sort({ salesCount: -1 })
                .limit(Math.min(limit, 10))
                .select('name category salesCount price stock');
            
            return topProducts;
        } catch (error) {
            console.error('Error fetching top products:', error);
            return [];
        }
    }

    static async getOrderStatus(orderId) {
        try {
            const order = await Order.findOne({ orderId });
            return order;
        } catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    }

    static async getStockInfo(searchTerms) {
        try {
            const searchRegex = new RegExp(searchTerms.join('|'), 'i');
            const products = await Product.find({
                $or: [
                    { name: searchRegex },
                    { category: searchRegex }
                ]
            }).limit(5);
            
            return products;
        } catch (error) {
            console.error('Error fetching stock info:', error);
            return [];
        }
    }
}

module.exports = ChatService;
