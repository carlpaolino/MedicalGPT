import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import PromptBar from '../components/PromptBar';
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

  // Fetch conversations on mount or when a new chat is created
  useEffect(() => {
    if (!token) return;
    fetch('/api/conversations', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setConversations(data.data);
      });
  }, [token, conversationId]);

  // Load messages for a selected conversation
  const handleSelectConversation = async (id: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
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

  const handleSend = async (input: string) => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    try {
      const body = conversationId ? { message: input, conversationId } : { message: input };
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
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
  };

  return (
    <div className="flex h-full w-full">
      <Sidebar
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        selectedConversationId={conversationId}
      />
      <main className="flex-1 flex flex-col bg-white dark:bg-blue-950">
        <div className="flex justify-between items-center px-4 pt-4">
          <h1 className="text-xl font-bold text-blue-700 dark:text-blue-200">MedGPT Chat</h1>
        </div>
        <ChatWindow messages={messages} loading={loading} error={error} />
        <PromptBar onSend={handleSend} disabled={loading} />
      </main>
    </div>
  );
};

export default ChatPage;
