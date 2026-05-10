import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./mermaid-diagram";

export function MarkdownBody({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 className="mt-14 mb-5 text-[1.5rem] font-bold tracking-tight font-heading text-[#1A1A2E] dark:text-[#EDF2EC]">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-10 mb-3 text-[1.15rem] font-semibold font-heading text-[#1A1A2E] dark:text-[#EDF2EC]">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-6 text-[16.5px] leading-[1.75] text-[#3D3D50] dark:text-[#C8D0C6] max-w-[65ch]">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mb-6 list-disc pl-6 space-y-2.5 text-[16.5px] leading-[1.75] text-[#3D3D50] dark:text-[#C8D0C6]">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-6 list-decimal pl-6 space-y-2.5 text-[16.5px] leading-[1.75] text-[#3D3D50] dark:text-[#C8D0C6]">
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
            className="font-medium text-[#6B47A8] underline underline-offset-2 decoration-[#6B47A8]/30 hover:decoration-[#6B47A8] dark:text-[#C5B3E6] dark:decoration-[#C5B3E6]/30 dark:hover:decoration-[#C5B3E6] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-8 rounded-xl bg-[#e8efe7] py-4 px-5 dark:bg-[#1E2A1E]">
            {children}
          </blockquote>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (className?.includes("language-mermaid")) {
            return (
              <MermaidDiagram chart={String(children).replace(/\n$/, "")} />
            );
          }
          if (isBlock) {
            return (
              <code className="block rounded-xl bg-[#1A1A2E] p-5 font-mono text-sm leading-relaxed text-[#E8EDE6] overflow-x-auto">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded-md bg-[#dde4db] px-1.5 py-0.5 font-mono text-[15px] text-[#1A1A2E] dark:bg-[#2A322A] dark:text-[#EDF2EC]">
              {children}
            </code>
          );
        },
        pre: ({ children }) => {
          const child = children as React.ReactElement<{ className?: string }>;
          if (child?.props?.className?.includes("language-mermaid")) {
            return <>{children}</>;
          }
          return (
            <pre className="mb-6 overflow-hidden rounded-xl">{children}</pre>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
