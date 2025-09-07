import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatInterface from './ChatInterface';

interface ChatWidgetProps {
  articleId: string;
  articleTitle?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ articleId, articleTitle }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-50"
          aria-label="Open chat"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full md:w-[450px] h-[600px] md:h-[700px] md:bottom-6 md:right-6 z-50">
          <ChatInterface 
            articleId={articleId} 
            articleTitle={articleTitle}
            onClose={() => setIsOpen(false)} 
          />
        </div>
      )}
    </>
  );
};

export default ChatWidget;