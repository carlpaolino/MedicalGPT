import React from 'react';
import { Message } from '../pages/ChatPage';

interface ChatWindowProps {
  messages: Message[];
  loading?: boolean;
  error?: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading, error }) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-blue-50 dark:bg-blue-900">
      <div className="max-w-2xl mx-auto space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded-lg px-4 py-3 shadow-md max-w-[80%] whitespace-pre-line text-base font-medium
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white self-end'
                  : 'bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'}
              `}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-blue-500 text-center">MedGPT is thinking...</div>
        )}
        {error && (
          <div className="text-red-500 text-center">{error}</div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
