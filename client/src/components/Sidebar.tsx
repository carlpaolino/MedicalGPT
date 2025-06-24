import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface Conversation {
  id: number;
  title: string;
}

interface SidebarProps {
  conversations: Conversation[];
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  selectedConversationId: number | null;
}

const Sidebar: React.FC<SidebarProps> = ({ conversations, onNewChat, onSelectConversation, onDeleteConversation, selectedConversationId }) => {
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-700 to-red-600 text-white flex flex-col p-4 shadow-lg h-full">
      <div className="flex items-center mb-8">
        <span className="text-3xl font-extrabold tracking-tight">MedGPT</span>
      </div>
      <button
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded mb-6 transition-colors"
        onClick={onNewChat}
      >
        <Plus size={18} />
        New Chat
      </button>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-sm text-blue-100/80">No conversations yet.</div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conv) => (
              <li key={conv.id} className="group flex items-center">
                <button
                  className={`flex-1 text-left px-3 py-2 rounded transition-colors ${selectedConversationId === conv.id ? 'bg-white text-blue-700 font-bold' : 'hover:bg-blue-800/60'}`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  {conv.title || `Conversation #${conv.id}`}
                </button>
                <button
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-200 hover:text-red-400"
                  onClick={() => onDeleteConversation(conv.id)}
                  aria-label="Delete conversation"
                  tabIndex={-1}
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-8 text-xs text-blue-100/60">© {new Date().getFullYear()} MedGPT</div>
    </aside>
  );
};

export default Sidebar; 