import React from 'react';
import ChatWindow from '../components/ChatWindow';
import PromptBar from '../components/PromptBar';

const ChatPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-blue-950">
      <ChatWindow />
      <PromptBar />
    </div>
  );
};

export default ChatPage; 