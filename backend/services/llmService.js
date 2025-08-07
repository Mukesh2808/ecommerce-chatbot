const Groq = require('groq-sdk');
const Product = require('../models/Product');
const Order = require('../models/Order');

class LLMService {
    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }

    async processWithLLM(userMessage, conversationHistory = []) {
        try {
            // First, gather relevant information based on user query
            const context = await this.gatherContext(userMessage);
            
            // Create a comprehensive prompt for the LLM
            const systemPrompt = this.buildSystemPrompt(context);
            
            // Prepare conversation history for context
            const messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.slice(-6).map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.message
                })),
                { role: 'user', content: userMessage }
            ];

            // Query the LLM
            const completion = await this.groq.chat.completions.create({
                messages: messages,
                model: 'llama3-8b-8192',
                temperature: 0.7,
                max_tokens: 1000,
                top_p: 1,
                stream: false
            });

            return completion.choices[0]?.message?.content || 
                   "I apologize, but I couldn't process your request at the moment.";

        } catch (error) {
            console.error('LLM Service Error:', error);
            return "I'm experiencing some technical difficulties. Let me try to help you with the information I have.";
        }
    }

    async gatherContext(userMessage) {
        const context = {
            products: [],
            orders: [],
            stockInfo: [],
            intent: this.detectIntent(userMessage)
        };

        const lowerMessage = userMessage.toLowerCase();

        try {
            // Gather product information
            if (this.isProductRelated(lowerMessage)) {
                if (lowerMessage.includes('top') || lowerMessage.includes('best') || lowerMessage.includes('popular')) {
                    context.products = await Product.find()
                        .sort({ salesCount: -1 })
                        .limit(10)
                        .select('name category price salesCount stock');
                } else {
                    // Search for specific products
                    const searchTerms = this.extractSearchTerms(userMessage);
                    if (searchTerms.length > 0) {
                        const searchRegex = new RegExp(searchTerms.join('|'), 'i');
                        context.products = await Product.find({
                            $or: [
                                { name: searchRegex },
                                { category: searchRegex }
                            ]
                        }).limit(10);
                    }
                }
            }

            // Gather order information
            if (this.isOrderRelated(lowerMessage)) {
                const orderIds = this.extractOrderIds(userMessage);
                if (orderIds.length > 0) {
                    context.orders = await Order.find({
                        orderId: { $in: orderIds }
                    });
                }
            }

            // Gather stock information
            if (this.isStockRelated(lowerMessage)) {
                const productTerms = this.extractSearchTerms(userMessage);
                if (productTerms.length > 0) {
                    const searchRegex = new RegExp(productTerms.join('|'), 'i');
                    context.stockInfo = await Product.find({
                        $or: [
                            { name: searchRegex },
                            { category: searchRegex }
                        ]
                    }).select('name stock price category').limit(5);
                }
            }

        } catch (error) {
            console.error('Error gathering context:', error);
        }

        return context;
    }

    buildSystemPrompt(context) {
        let prompt = `You are a helpful customer support chatbot for an e-commerce clothing store. Your role is to assist customers with their inquiries about products, orders, and inventory.

INSTRUCTIONS:
- Be friendly, professional, and helpful
- Provide accurate information based on the data provided
- If you don't have specific information, politely explain what you can help with
- Use emojis appropriately to make responses engaging
- Format responses clearly with bullet points or numbered lists when appropriate
- For product recommendations, mention key details like price, category, and availability

AVAILABLE ACTIONS:
- Product search and information
- Order status tracking
- Inventory/stock checking
- Product recommendations
- General customer support

`;

        // Add product context
        if (context.products && context.products.length > 0) {
            prompt += `\nCURRENT PRODUCTS DATA:\n`;
            context.products.forEach(product => {
                prompt += `- ${product.name} (${product.category}): $${product.price}, Stock: ${product.stock}, Sales: ${product.salesCount}\n`;
            });
        }

        // Add order context
        if (context.orders && context.orders.length > 0) {
            prompt += `\nCURRENT ORDERS DATA:\n`;
            context.orders.forEach(order => {
                prompt += `- Order #${order.orderId}: Status: ${order.status}, Customer: ${order.customerName}, Total: $${order.totalAmount}, Date: ${new Date(order.orderDate).toLocaleDateString()}\n`;
                if (order.products && order.products.length > 0) {
                    prompt += `  Items: ${order.products.map(p => `${p.quantity}x Product ${p.productId} ($${p.price})`).join(', ')}\n`;
                }
            });
        }

        // Add stock context
        if (context.stockInfo && context.stockInfo.length > 0) {
            prompt += `\nCURRENT STOCK INFORMATION:\n`;
            context.stockInfo.forEach(product => {
                prompt += `- ${product.name}: ${product.stock} units available, $${product.price}\n`;
            });
        }

        prompt += `\nIMPORTANT: Base your responses ONLY on the data provided above. If specific information isn't available in the data, explain what information you do have and suggest alternative ways to help.`;

        return prompt;
    }

    detectIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        if (this.isProductRelated(lowerMessage)) {
            if (lowerMessage.includes('top') || lowerMessage.includes('best')) {
                return 'top_products';
            }
            return 'product_search';
        }
        
        if (this.isOrderRelated(lowerMessage)) {
            return 'order_status';
        }
        
        if (this.isStockRelated(lowerMessage)) {
            return 'stock_inquiry';
        }
        
        return 'general';
    }

    isProductRelated(message) {
        const productKeywords = ['product', 'item', 'clothing', 'shirt', 'dress', 'jeans', 'hoodie', 'show', 'find', 'search', 'top', 'best', 'popular'];
        return productKeywords.some(keyword => message.includes(keyword));
    }

    isOrderRelated(message) {
        const orderKeywords = ['order', 'status', 'track', 'delivery', 'shipped', 'delivered'];
        return orderKeywords.some(keyword => message.includes(keyword));
    }

    isStockRelated(message) {
        const stockKeywords = ['stock', 'available', 'inventory', 'left', 'how many'];
        return stockKeywords.some(keyword => message.includes(keyword));
    }

    extractSearchTerms(message) {
        // Remove common words and extract meaningful terms
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'show', 'me', 'find', 'search', 'how', 'many', 'what', 'are', 'is'];
        return message.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => word.length > 2 && !commonWords.includes(word))
            .slice(0, 5); // Limit to 5 terms
    }

    extractOrderIds(message) {
        // Extract potential order IDs (5+ digit numbers)
        const orderIdMatch = message.match(/\b\d{4,}\b/g);
        return orderIdMatch || [];
    }

    async askClarifyingQuestion(message, context) {
        // Use LLM to generate clarifying questions when information is incomplete
        try {
            const clarificationPrompt = `
Based on the user's message: "${message}"

The user seems to be asking about something, but I need more information to help them properly. 
Generate a helpful clarifying question that would help me provide better assistance.

Context available: ${JSON.stringify(context, null, 2)}

Generate a friendly, specific clarifying question:`;

            const completion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: clarificationPrompt }],
                model: 'llama3-8b-8192',
                temperature: 0.8,
                max_tokens: 150
            });

            return completion.choices[0]?.message?.content || 
                   "Could you please provide more details about what you're looking for?";

        } catch (error) {
            console.error('Error generating clarifying question:', error);
            return "Could you please provide more specific information so I can help you better?";
        }
    }
}

module.exports = new LLMService();
