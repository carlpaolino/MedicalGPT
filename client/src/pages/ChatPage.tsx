import React, { useState, useEffect, useRef } from 'react';
import ChatWindow from '../components/ChatWindow';
import PromptBar, { PromptBarRef } from '../components/PromptBar';
import Sidebar, { Conversation } from '../components/Sidebar';
import { useAuth } from '../App';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const promptBarRef = useRef<PromptBarRef>(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Fetch conversations on mount or when a new chat is created
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/conversations`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setConversations(data.data);
      });
  }, [token, conversationId, API_BASE_URL]);

  // Load messages for a selected conversation
  const handleSelectConversation = async (id: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error loading conversation');
      setConversationId(id);
      setMessages(
        data.data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (input: string, file?: File | null) => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    try {
      const formData = new FormData();
      formData.append('message', input);
      if (conversationId) formData.append('conversationId', conversationId.toString());
      if (file) formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error');
      setConversationId(data.data.conversationId);
      setMessages([...newMessages, { role: 'assistant' as const, content: data.data.response }]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setTimeout(() => {
      promptBarRef.current?.focusInput();
    }, 0);
  };

  const handleDeleteConversation = async (id: number) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      setConversations(conversations => conversations.filter(c => c.id !== id));
      if (conversationId === id) {
        setMessages([]);
        setConversationId(null);
        setError(null);
      }
    } catch (err) {
      // Optionally show an error
    }
  };

  const isNewConversation = messages.length === 0;

  return (
    <div className="flex h-full w-full min-h-0">
      <Sidebar
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        selectedConversationId={conversationId}
      />
      <main className="flex-1 flex flex-col h-full min-h-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950">
        {isNewConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-200 mb-10 tracking-tight">MedGPT Chat</h1>
            <div className="w-full max-w-2xl">
              <PromptBar ref={promptBarRef} onSend={handleSend} disabled={loading} />
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-blue-950/80 shadow-sm border-b border-blue-100 dark:border-blue-800 sticky top-0 z-10 rounded-b-xl">
              <h1 className="text-2xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                MedGPT Chat
              </h1>
            </header>
            <div className="flex-1 min-h-0 flex flex-col transition-all duration-300">
              <ChatWindow messages={messages} loading={loading} error={error} />
            </div>
            <PromptBar ref={promptBarRef} onSend={handleSend} disabled={loading} />
          </>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
