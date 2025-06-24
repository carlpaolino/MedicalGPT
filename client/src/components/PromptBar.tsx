import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send } from 'lucide-react';

export interface PromptBarRef {
  focusInput: () => void;
}

interface PromptBarProps {
  onSend: (input: string) => void;
  disabled?: boolean;
}

const PromptBar = forwardRef<PromptBarRef, PromptBarProps>(({ onSend, disabled }, ref) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when cleared and not disabled
  useEffect(() => {
    if (input === '' && !disabled) {
      inputRef.current?.focus();
    }
  }, [input, disabled]);

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    }
  }));

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <form onSubmit={handleSend} className="w-full bg-white dark:bg-blue-950 border-t border-blue-200 dark:border-blue-800 flex items-center px-4 py-3 gap-2">
      <input
        ref={inputRef}
        className="flex-1 bg-transparent outline-none text-blue-900 dark:text-blue-100 placeholder-blue-400 dark:placeholder-blue-300 px-3 py-2 rounded-md"
        type="text"
        placeholder="Type your medical question..."
        value={input}
        onChange={e => setInput(e.target.value)}
        aria-label="Type your medical question"
        autoFocus
        disabled={disabled}
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors disabled:opacity-50"
        disabled={!input.trim() || disabled}
        aria-label="Send"
      >
        <Send size={20} />
      </button>
    </form>
  );
});

export default PromptBar;
