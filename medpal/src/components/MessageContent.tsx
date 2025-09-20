import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
  isAI: boolean;
}

export default function MessageContent({ content, isAI }: MessageContentProps) {
  if (!isAI) {
    // For user messages, render as plain text with line breaks
    return (
      <p className="text-sm whitespace-pre-wrap leading-relaxed">
        {content}
      </p>
    );
  }

  // For AI messages, render with markdown styling
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-gray-900 mb-2 mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-gray-900 mb-2 mt-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-gray-900 mb-1 mt-2">
              {children}
            </h3>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm leading-relaxed mb-2 last:mb-0">
              {children}
            </p>
          ),

          // Bold text
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),

          // Italic text
          em: ({ children }) => (
            <em className="italic text-gray-800">
              {children}
            </em>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-2 ml-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-2 ml-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed">
              {children}
            </li>
          ),

          // Code blocks
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2">
                <code className="text-xs font-mono text-gray-800">
                  {children}
                </code>
              </pre>
            );
          },

          // Blockquotes (for important medical notes)
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50 rounded-r-lg mb-2 relative">
              <div className="flex items-start space-x-2">
                <span className="text-amber-600 text-sm font-bold">⚠️</span>
                <div className="text-sm text-amber-900 font-medium">
                  {children}
                </div>
              </div>
            </blockquote>
          ),

          // Tables (for medical data)
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-gray-200 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-xs font-semibold text-gray-900 border-b border-gray-200 text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm text-gray-700 border-b border-gray-200">
              {children}
            </td>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="border-gray-300 my-3" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}