import React from 'react';

const ChatWindow: React.FC = () => {
  // Placeholder messages
  const messages = [
    { role: 'assistant', content: 'Hello! I am MedGPT, your medical AI assistant. How can I help you today?' },
    { role: 'user', content: 'Why do I have chest pain?' },
    { role: 'assistant', content: 'Chest pain can have many causes, including muscle strain, anxiety, or heart-related issues. If you experience severe or persistent chest pain, seek emergency care. [1]\n\n**Care Level:** EMERGENCY\n\n[1] Mayo Clinic: https://www.mayoclinic.org/' }
  ];

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
      </div>
    </div>
  );
};

export default ChatWindow; 