/**
 * Message Renderer Component
 * Renders chat messages with proper markdown formatting and clickable links
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, FileText, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ content, role }) => {
  // Extract links from the content
  const extractLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    return matches;
  };

  // Parse sources from the content
  const parseSourcesFromContent = (text: string) => {
    const sources: Array<{
      title: string;
      url?: string;
      date?: string;
      relevance?: string;
      source?: string;
    }> = [];

    // Pattern to match article references
    const articlePattern = /📰\s*\[([^\]]+)\]:\s*"([^"]+)"\s*-\s*(\d{4}-\d{2}-\d{2})/g;
    let match;
    
    while ((match = articlePattern.exec(text)) !== null) {
      sources.push({
        source: match[1],
        title: match[2],
        date: match[3]
      });
    }

    // Also try to extract from table format
    const tableRows = text.split('\n').filter(line => line.includes('|'));
    tableRows.forEach((row, index) => {
      if (index > 1) { // Skip header rows
        const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length >= 4) {
          const [source, title, relevance, date] = cells;
          if (source && source !== '---' && source !== 'Fuente') {
            sources.push({ source, title, relevance, date });
          }
        }
      }
    });

    return sources;
  };

  const links = extractLinks(content);
  const sources = parseSourcesFromContent(content);

  // Custom components for ReactMarkdown
  const components = {
    // Render tables with better styling
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
    th: ({ children }: any) => (
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {children}
      </td>
    ),
    // Render links with icon
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
      >
        {children}
        <ExternalLink className="w-3 h-3" />
      </a>
    ),
    // Style paragraphs
    p: ({ children }: any) => (
      <p className="mb-2 text-sm leading-relaxed">{children}</p>
    ),
    // Style lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-sm">{children}</li>
    ),
    // Style headings
    h1: ({ children }: any) => (
      <h1 className="text-lg font-bold mb-2">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-md font-semibold mb-2">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-sm font-semibold mb-1">{children}</h3>
    ),
    // Code blocks
    code: ({ inline, children }: any) => {
      if (inline) {
        return (
          <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono">
            {children}
          </code>
        );
      }
      return (
        <pre className="p-2 rounded bg-gray-100 dark:bg-gray-800 overflow-x-auto">
          <code className="text-xs font-mono">{children}</code>
        </pre>
      );
    },
    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 py-1 my-2 italic">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className={`message-content ${role === 'assistant' ? 'assistant-message' : ''}`}>
      {/* Render markdown content */}
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>

      {/* If there are extracted sources, show them in a nicer format */}
      {sources.length > 0 && role === 'assistant' && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Fuentes Consultadas ({sources.length})
          </h4>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div
                key={index}
                className="flex flex-col p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {source.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {source.source}
                      </span>
                      {source.date && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          • {source.date}
                        </span>
                      )}
                      {source.relevance && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          source.relevance === 'Alta' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {source.relevance}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* If we can generate a search URL */}
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(source.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Buscar en Google"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If there are direct links in the content */}
      {links.length > 0 && role === 'assistant' && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
            Enlaces Directos:
          </p>
          <div className="space-y-1">
            {links.map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate"
              >
                <ExternalLink className="inline w-3 h-3 mr-1" />
                {link}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Warning for financial advice */}
      {content.includes('asesoramiento financiero') && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Esta información no constituye asesoramiento financiero. Consulte a un profesional.
          </p>
        </div>
      )}
    </div>
  );
};

export default MessageRenderer;