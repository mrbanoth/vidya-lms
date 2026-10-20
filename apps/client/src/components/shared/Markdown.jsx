import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export default function Markdown({ children, className }) {
  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary", className)}>
      <ReactMarkdown
        components={{ a: ({ node: _n, ...p }) => <a {...p} target="_blank" rel="noreferrer noopener" /> }}
      >
        {children || ""}
      </ReactMarkdown>
    </div>
  );
}
