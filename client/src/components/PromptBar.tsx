import React, { useState } from 'react';
import { Send } from 'lucide-react';

const PromptBar: React.FC = () => {
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // TODO: Send message to backend
    setInput('');
  };

  return (
    <form onSubmit={handleSend} className="w-full bg-white dark:bg-blue-950 border-t border-blue-200 dark:border-blue-800 flex items-center px-4 py-3 gap-2">
      <input
        className="flex-1 bg-transparent outline-none text-blue-900 dark:text-blue-100 placeholder-blue-400 dark:placeholder-blue-300 px-3 py-2 rounded-md"
        type="text"
        placeholder="Type your medical question..."
        value={input}
        onChange={e => setInput(e.target.value)}
        aria-label="Type your medical question"
        autoFocus
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors disabled:opacity-50"
        disabled={!input.trim()}
        aria-label="Send"
      >
        <Send size={20} />
      </button>
    </form>
  );
};

export default PromptBar; 