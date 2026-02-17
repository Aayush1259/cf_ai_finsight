/**
 * Chat Component - Main Chat Interface
 * ============================================================================
 * This component handles the chat UI for interacting with the AI financial
 * literacy coach. It manages:
 * - Fetching and displaying chat history
 * - Sending new messages to the API
 * - Triggering the daily briefing workflow
 * - Real-time UI updates and loading states
 * ============================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// Message type definition
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// API base URL - empty string uses relative URLs (same origin)
const API_BASE = '';

function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch chat history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  /**
   * Fetch chat history from the API
   */
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      setMessages(data.history || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load chat history. Please refresh the page.');
    }
  };

  /**
   * Send a message to the AI coach
   */
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = inputValue.trim();
    if (!message || isLoading) return;

    // Clear input immediately for better UX
    setInputValue('');
    setError(null);

    // Add user message to UI immediately (optimistic update)
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
      setInputValue(message); // Restore the input
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  /**
   * Trigger the daily briefing workflow manually
   */
  const triggerBriefing = async () => {
    if (isBriefingLoading) return;
    
    setIsBriefingLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/trigger-briefing`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to trigger briefing');
      }

      // Poll for new messages after triggering
      // The workflow takes a few seconds to complete
      setTimeout(async () => {
        await fetchHistory();
        setIsBriefingLoading(false);
      }, 5000); // Wait 5 seconds for workflow to complete

    } catch (err) {
      console.error('Error triggering briefing:', err);
      setError('Failed to trigger daily briefing. Please try again.');
      setIsBriefingLoading(false);
    }
  };

  /**
   * Clear chat history
   */
  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/clear`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to clear history');
      
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Failed to clear history. Please try again.');
    }
  };

  /**
   * Handle textarea key press (Enter to send, Shift+Enter for newline)
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  /**
   * Auto-resize textarea based on content
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = 'auto';
    // Set to scrollHeight but cap at 200px
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="relative bg-white/90 rounded-3xl shadow-2xl border border-gray-100 flex flex-col h-[70vh] max-h-[70vh] w-full backdrop-blur-lg overflow-hidden transition-all"
      style={{
        background: 'radial-gradient(ellipse at 60% 0%, #f8fafc 70%, #e0e7ef 100%)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
      }}
    >
      {/* Chat Header with Actions */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Chat with FinSight</h2>
          <p className="text-sm text-gray-500">Ask me anything about personal finance!</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Trigger Daily Briefing Button */}
          <button
            onClick={triggerBriefing}
            disabled={isBriefingLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-finance-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isBriefingLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm font-medium">Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium">Daily Briefing</span>
              </>
            )}
          </button>
          
          {/* Clear History Button */}
          <button
            onClick={clearHistory}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear chat history"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cf-orange/20 to-cf-orange/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-cf-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to FinSight!</h3>
            <p className="text-gray-500 max-w-md">
              I'm your personal financial literacy coach. Ask me about budgeting, saving, investing, 
              student loans, or any other financial topic!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['How do I create a budget?', 'Explain credit scores', 'Tips for saving money'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputValue(suggestion)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <TransitionGroup className="space-y-4">
            {messages
              .filter(msg => msg.role !== 'system')
              .map((msg, index) => (
                <CSSTransition
                  key={index}
                  timeout={350}
                  classNames="chat-bubble"
                >
                  <MessageBubble message={msg} />
                </CSSTransition>
              ))}
          </TransitionGroup>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cf-orange to-cf-orange-dark rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <form onSubmit={sendMessage} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Ask about budgeting, saving, investing..."
              rows={1}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-cf-orange focus:border-transparent transition-all"
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cf-orange to-cf-orange-dark hover:from-cf-orange-dark hover:to-cf-orange text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/**
 * Message Bubble Component
 */

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isBriefing = message.content.includes('📊 **Daily Financial Briefing**');

  // Animated gradient border for assistant
  const assistantBubbleStyle = isBriefing
    ? {
        background: 'linear-gradient(90deg, #e0e7ff 0%, #f0f7ff 100%)',
        border: '1.5px solid #b6d0ff',
      }
    : {
        background: 'linear-gradient(90deg, #f8fafc 0%, #f3f4f6 100%)',
        border: '1.5px solid #e0e7ef',
      };

  return (
    <div
      className={`flex items-start space-x-3 chat-bubble-animate ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
      style={{
        animation: 'fadeInUp 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/60 ${
          isUser
            ? 'bg-gradient-to-br from-gray-600 to-gray-700'
            : isBriefing
            ? 'bg-gradient-to-br from-finance-blue to-blue-600'
            : 'bg-gradient-to-br from-cf-orange to-cf-orange-dark'
        }`}
      >
        {isUser ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : isBriefing ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm transition-all duration-300 ${
          isUser
            ? 'bg-gradient-to-r from-cf-orange to-cf-orange-dark text-white rounded-tr-none'
            : isBriefing
            ? 'rounded-tl-none'
            : 'rounded-tl-none'
        }`}
        style={isUser ? {} : assistantBubbleStyle}
      >
        <div className={`message-content text-base leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}
          style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <div className={`mt-1 text-xs ${isUser ? 'text-white/70' : 'text-gray-400'}`}
          style={{ textAlign: isUser ? 'right' : 'left' }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

export default Chat;
