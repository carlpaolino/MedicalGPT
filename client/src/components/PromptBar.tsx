import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, ChangeEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';

export interface PromptBarRef {
  focusInput: () => void;
}

interface PromptBarProps {
  onSend: (input: string, file?: File | null) => void;
  disabled?: boolean;
}

const PromptBar = forwardRef<PromptBarRef, PromptBarProps>(({ onSend, disabled }, ref) => {
  const [input, setInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onSend(input, selectedFile);
    setInput('');
    setSelectedFile(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className={`w-full bg-white dark:bg-blue-950 border-t border-blue-200 dark:border-blue-800 flex items-center px-4 py-3 gap-2 relative ${dragActive ? 'ring-2 ring-blue-400' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        type="button"
        className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-500 dark:text-blue-200 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        tabIndex={-1}
        aria-label="Attach file"
        disabled={disabled}
      >
        <Paperclip size={20} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".txt,.md,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,image/*"
        onChange={handleFileChange}
        tabIndex={-1}
        disabled={disabled}
      />
      <input
        ref={inputRef}
        className="flex-1 bg-transparent outline-none text-blue-900 dark:text-blue-100 placeholder-blue-400 dark:placeholder-blue-300 px-3 py-2 rounded-md border-2 border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800 shadow-md transition-all duration-200"
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
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors disabled:opacity-50 shadow-md"
        disabled={!input.trim() || disabled}
        aria-label="Send"
      >
        <Send size={20} />
      </button>
      {selectedFile && (
        <div className="absolute left-14 bottom-14 bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded shadow px-3 py-1 text-xs text-blue-700 dark:text-blue-200 flex items-center gap-2">
          <Paperclip size={16} />
          <span className="truncate max-w-[160px]">{selectedFile.name}</span>
          <button
            type="button"
            className="ml-1 text-red-400 hover:text-red-600"
            onClick={() => setSelectedFile(null)}
            aria-label="Remove file"
          >
            ×
          </button>
        </div>
      )}
    </form>
  );
});

export default PromptBar;
