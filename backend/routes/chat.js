const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const ChatService = require('../services/chatService');

// Main chat endpoint with LLM integration
router.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        if (!message || !sessionId) {
            return res.status(400).json({ 
                error: 'Message and sessionId are required',
                received: { message: !!message, sessionId: !!sessionId }
            });
        }
        
        console.log(`Chat request - Session: ${sessionId}, Message: ${message.substring(0, 50)}...`);
        
        // Find or create conversation
        let conversation = await Conversation.findOne({ sessionId });
        if (!conversation) {
            conversation = new Conversation({ 
                sessionId,
                messages: [],
                isActive: true
            });
        }
        
        // Add user message
        const userMessage = {
            sender: 'user',
            message: message.trim(),
            timestamp: new Date()
        };
        conversation.messages.push(userMessage);
        
        // Process message with conversation history for context
        const botResponse = await ChatService.processMessage(
            message, 
            conversation.messages.slice(-10) // Pass last 10 messages for context
        );
        
        // Add bot response
        const botMessage = {
            sender: 'bot',
            message: botResponse,
            timestamp: new Date()
        };
        conversation.messages.push(botMessage);
        
        // Save conversation
        await conversation.save();
        
        res.json({ 
            response: botResponse,
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            messageCount: conversation.messages.length
        });
        
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date().toISOString()
        });
    }
});

// Get conversation history
router.get('/api/chat/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
        
        const conversation = await Conversation.findOne({ sessionId });
        
        if (!conversation) {
            return res.json({ 
                messages: [],
                sessionId: sessionId,
                found: false
            });
        }
        
        res.json({ 
            messages: conversation.messages,
            sessionId: sessionId,
            lastActivity: conversation.lastActivity,
            found: true,
            messageCount: conversation.messages.length
        });
        
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ 
            error: 'Failed to fetch conversation history',
            timestamp: new Date().toISOString()
        });
    }
});

// Clear conversation
router.delete('/api/chat/clear/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
        
        const result = await Conversation.findOneAndUpdate(
            { sessionId },
            { messages: [], isActive: false },
            { new: true, upsert: true }
        );
        
        res.json({ 
            message: 'Conversation cleared successfully',
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error clearing conversation:', error);
        res.status(500).json({ 
            error: 'Failed to clear conversation',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;