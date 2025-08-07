import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  messages: Message[];
  lastActivity: string;
  isActive: boolean;
}

interface ChatState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
  apiBaseUrl: string;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

const initialState: ChatState = {
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  connectionStatus: 'disconnected'
};

// Enhanced API integration with better error handling
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, sessionId }: { message: string; sessionId: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { chat: ChatState };
      
      // Check connection before sending
      const healthResponse = await fetch(`${state.chat.apiBaseUrl}/api/health`);
      if (!healthResponse.ok) {
        throw new Error('Backend server is not responding');
      }

      const response = await fetch(`${state.chat.apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        userMessage: {
          id: 'user-' + Date.now(),
          sender: 'user' as const,
          message: message.trim(),
          timestamp: new Date().toISOString()
        },
        botMessage: {
          id: 'bot-' + Date.now(),
          sender: 'bot' as const,
          message: data.response,
          timestamp: data.timestamp
        },
        sessionId
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send message');
    }
  }
);

export const checkBackendConnection = createAsyncThunk(
  'chat/checkConnection',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { chat: ChatState };
      const response = await fetch(`${state.chat.apiBaseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Backend health check failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Connection failed');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    createNewSession: (state, action: PayloadAction<string>) => {
      const newSession: ChatSession = {
        sessionId: action.payload,
        messages: [{
          id: 'welcome-' + Date.now(),
          sender: 'bot',
          message: '👋 Welcome to our E-commerce Assistant!\n\n' +
                  'I can help you with:\n' +
                  '• 🏆 Top-selling products\n' +
                  '• 📦 Order status tracking\n' +
                  '• 📊 Product stock information\n' +
                  '• 🔍 Product searches\n\n' +
                  'What can I help you with today?',
          timestamp: new Date().toISOString()
        }],
        lastActivity: new Date().toISOString(),
        isActive: true
      };
      
      state.currentSession = newSession;
      state.sessions.push(newSession);
    },
    
    setConnectionStatus: (state, action: PayloadAction<'connected' | 'disconnected' | 'connecting'>) => {
      state.connectionStatus = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.connectionStatus = 'connecting';
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.connectionStatus = 'connected';
        
        if (state.currentSession?.sessionId === action.payload.sessionId) {
          state.currentSession.messages.push(action.payload.userMessage);
          state.currentSession.messages.push(action.payload.botMessage);
          state.currentSession.lastActivity = new Date().toISOString();
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.connectionStatus = 'disconnected';
        state.error = action.payload as string;
      })
      
      // Check connection
      .addCase(checkBackendConnection.fulfilled, (state) => {
        state.connectionStatus = 'connected';
        state.error = null;
      })
      .addCase(checkBackendConnection.rejected, (state, action) => {
        state.connectionStatus = 'disconnected';
        state.error = action.payload as string;
      });
  }
});

export const { createNewSession, setConnectionStatus, clearError } = chatSlice.actions;
export default chatSlice.reducer;
