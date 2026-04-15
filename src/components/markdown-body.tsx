import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownBody({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 className="mt-12 mb-4 text-2xl font-bold tracking-tight font-heading text-[#1A1A2E] dark:text-[#EDF2EC]">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-8 mb-3 text-xl font-semibold font-heading text-[#1A1A2E] dark:text-[#EDF2EC]">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-6 text-base leading-[1.7] text-[#3D3D50] dark:text-[#C8D0C6]">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mb-6 list-disc pl-6 space-y-2 text-base leading-[1.7] text-[#3D3D50] dark:text-[#C8D0C6]">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-6 list-decimal pl-6 space-y-2 text-base leading-[1.7] text-[#3D3D50] dark:text-[#C8D0C6]">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-[#1A1A2E] dark:text-[#EDF2EC]">
            {children}
          </strong>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="font-medium text-[#6B47A8] hover:text-[#5B3D99] dark:text-[#C5B3E6] dark:hover:text-[#D4C8F0]"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-6 rounded-xl border-l-4 border-[#8ECDA0] bg-[#EDF5EF] p-4 dark:bg-[#1A3327]/50 dark:border-[#8ECDA0]">
            {children}
          </blockquote>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block rounded-xl bg-[#1A1A2E] p-5 font-mono text-sm leading-relaxed text-[#E8EDE6] overflow-x-auto">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded-lg bg-[#E2E8E0] px-1.5 py-0.5 font-mono text-[15px] text-[#1A1A2E] dark:bg-[#2A322A] dark:text-[#EDF2EC]">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-6 overflow-hidden rounded-xl">{children}</pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
