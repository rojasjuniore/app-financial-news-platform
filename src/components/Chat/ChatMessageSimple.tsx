import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Copy, Check, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    confidence?: number;
    model?: string;
    sources?: any[];
    tradingPlanDetected?: boolean;
  };
}

const ChatMessageSimple: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom components for markdown rendering
  const components = {
    // Tables with proper styling
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{children}</td>
    ),

    // Links with external icon
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-1 underline-offset-2 transition-colors"
      >
        {children}
        <ExternalLink className="w-3 h-3" />
      </a>
    ),

    // Code blocks with basic styling
    code: ({ children, className }: any) => {
      const isBlock = className?.includes('language-');
      
      if (isBlock) {
        return (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
            <code className="text-sm font-mono">{children}</code>
          </pre>
        );
      }
      
      return (
        <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-red-600 dark:text-red-400">
          {children}
        </code>
      );
    },

    // Headers with better styling
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-white">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-800 dark:text-gray-100">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-200">{children}</h3>
    ),

    // Lists with better spacing
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-2 my-4 ml-4">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-2 my-4 ml-4">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700 dark:text-gray-300">{children}</li>
    ),

    // Blockquotes with styling
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 dark:text-gray-400">
        {children}
      </blockquote>
    ),

    // Paragraphs with proper spacing
    p: ({ children }: any) => (
      <p className="my-3 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>
    ),

    // Horizontal rules
    hr: () => <hr className="my-6 border-gray-300 dark:border-gray-700" />,

    // Strong and emphasis
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-600 dark:text-gray-400">{children}</em>
    ),
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6 group`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown components={components as any}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Metadata for assistant messages */}
          {!isUser && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                {message.confidence && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {(message.confidence * 100).toFixed(0)}% confidence
                  </span>
                )}
                {message.model && (
                  <span className="font-mono">{message.model}</span>
                )}
                {message.tradingPlanDetected && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    Trading Plan Detected
                  </span>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageSimple;