import React from 'react';
import { Plus } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-700 to-red-600 text-white flex flex-col p-4 shadow-lg h-full">
      <div className="flex items-center mb-8">
        <span className="text-3xl font-extrabold tracking-tight">MedGPT</span>
      </div>
      <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded mb-6 transition-colors">
        <Plus size={18} />
        New Chat
      </button>
      <div className="flex-1 overflow-y-auto">
        {/* Conversation list placeholder */}
        <div className="text-sm text-blue-100/80">No conversations yet.</div>
      </div>
      <div className="mt-8 text-xs text-blue-100/60">© {new Date().getFullYear()} MedGPT</div>
    </aside>
  );
};

export default Sidebar; 