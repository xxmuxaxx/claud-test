import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { fieldClass } from '@/components/ui/fieldClass'
import { cn } from '@/lib/cn'
import { normalizeTags } from '@/lib/wiki'

interface TagInputProps {
  id: string
  tags: string[]
  onChange: (tags: string[]) => void
}

/** Enter, comma or leaving the field turns the typed text into a tag; Backspace removes the last. */
export function TagInput({ id, tags, onChange }: TagInputProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')

  function commit(text: string) {
    setDraft('')
    // A pasted "react, hooks" becomes two tags.
    onChange(normalizeTags([...tags, ...text.split(',')]))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault() // Enter must not submit the article form.
      commit(draft)
    } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div
      className={cn(
        fieldClass,
        'flex flex-wrap items-center gap-2 focus-within:border-brand-500 focus-within:outline-2 focus-within:outline-brand-500/30',
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pr-1 pl-2.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
        >
          #{tag}
          <button
            type="button"
            aria-label={t('wiki.editor.removeTag', { tag })}
            onClick={() => onChange(tags.filter((item) => item !== tag))}
            className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-900"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={tags.length === 0 ? t('wiki.editor.tagsPlaceholder') : undefined}
        className="min-w-32 flex-1 bg-transparent outline-none placeholder:text-slate-400"
      />
    </div>
  )
}
