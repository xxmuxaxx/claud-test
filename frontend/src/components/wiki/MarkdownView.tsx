import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/cn'

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/**
 * The article title is the page's <h1>, so a Markdown `# Heading` becomes an <h2> and so on.
 * Looks are keyed on `wiki-h1..6` (the Markdown level), not on the tag.
 */
const heading =
  (level: HeadingLevel): Components['h1'] =>
  ({ children }) => {
    const Tag = `h${Math.min(level + 1, 6)}` as 'h2'
    return <Tag className={`wiki-h${level}`}>{children}</Tag>
  }

const components: Components = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  h5: heading(5),
  h6: heading(6),
  a: ({ href, children }) => {
    const external = href !== undefined && /^https?:\/\//i.test(href)
    return (
      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  },
  // Wide tables scroll on their own instead of stretching the page.
  table: ({ children }) => (
    <div className="wiki-table-scroll">
      <table>{children}</table>
    </div>
  ),
}

interface MarkdownViewProps {
  children: string
  className?: string
}

/**
 * Renders Markdown (CommonMark + GFM tables, task lists, strikethrough). Raw HTML in the source
 * is not rendered and unsafe URLs are dropped, so user content cannot inject markup.
 * Typography lives in `.wiki-prose` (index.css).
 */
export function MarkdownView({ children, className }: MarkdownViewProps) {
  return (
    <div className={cn('wiki-prose', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
