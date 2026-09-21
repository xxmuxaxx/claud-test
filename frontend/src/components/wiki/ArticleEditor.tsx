import { useId, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { buttonClass } from '@/components/ui/buttonClass'
import { Button } from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/fieldClass'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { cn } from '@/lib/cn'
import { normalizeTags } from '@/lib/wiki'
import { useWikiStore } from '@/store/useWikiStore'
import type { WikiArticle } from '@/types/wiki'
import { MarkdownView } from './MarkdownView'
import { TagInput } from './TagInput'

type Pane = 'write' | 'preview'

const PANES: readonly Pane[] = ['write', 'preview']

interface ArticleEditorProps {
  /** The article being edited; omitted when creating a new one. */
  article?: WikiArticle
}

export function ArticleEditor({ article }: ArticleEditorProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const { createArticle, updateArticle } = useWikiStore()
  const ids = { title: useId(), description: useId(), tags: useId(), content: useId() }
  const titleRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(article?.title ?? '')
  const [description, setDescription] = useState(article?.description ?? '')
  const [tags, setTags] = useState(article?.tags ?? [])
  const [content, setContent] = useState(article?.content ?? '')
  const [pane, setPane] = useState<Pane>('write')
  const [titleMissing, setTitleMissing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (title.trim() === '') {
      setTitleMissing(true)
      titleRef.current?.focus()
      return
    }

    setSaving(true)
    setSaveError(null)
    const input = {
      title: title.trim(),
      description: description.trim() || undefined,
      content,
      tags: normalizeTags(tags),
    }
    try {
      const saved = article ? await updateArticle(article.id, input) : await createArticle(input)
      void navigate(`/wiki/${saved.id}`)
    } catch (failure) {
      // Keep everything the user typed and let them try again.
      setSaveError(failure)
      setSaving(false)
    }
  }

  const showEditor = isDesktop || pane === 'write'
  const showPreview = isDesktop || pane === 'preview'

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {article ? t('wiki.editor.editTitle') : t('wiki.editor.createTitle')}
      </h1>

      <div className="space-y-1.5">
        <label htmlFor={ids.title} className="text-sm font-medium">
          {t('wiki.editor.titleField')}
        </label>
        <input
          ref={titleRef}
          id={ids.title}
          value={title}
          maxLength={200}
          onChange={(event) => {
            setTitle(event.target.value)
            setTitleMissing(false)
          }}
          aria-invalid={titleMissing}
          aria-describedby={titleMissing ? `${ids.title}-error` : undefined}
          className={cn(fieldClass, 'text-base', titleMissing && 'border-red-500')}
        />
        {titleMissing && (
          <p
            id={`${ids.title}-error`}
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {t('wiki.editor.titleRequired')}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={ids.description} className="text-sm font-medium">
          {t('wiki.editor.descriptionField')}
        </label>
        <input
          id={ids.description}
          value={description}
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
          aria-describedby={`${ids.description}-hint`}
          className={fieldClass}
        />
        <p id={`${ids.description}-hint`} className="text-xs text-slate-500 dark:text-slate-400">
          {t('wiki.editor.descriptionHint')}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={ids.tags} className="text-sm font-medium">
          {t('wiki.editor.tagsField')}
        </label>
        <TagInput id={ids.tags} tags={tags} onChange={setTags} />
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <label htmlFor={ids.content} className="text-sm font-medium">
            {t('wiki.editor.contentField')}
          </label>
          {!isDesktop && (
            <div
              role="tablist"
              className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
            >
              {PANES.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={pane === value}
                  onClick={() => setPane(value)}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm font-medium transition',
                    pane === value
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                  )}
                >
                  {t(`wiki.editor.${value}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {showEditor && (
            <textarea
              id={ids.content}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t('wiki.editor.contentPlaceholder')}
              spellCheck={false}
              className={cn(
                fieldClass,
                'min-h-[24rem] resize-y font-mono leading-6 lg:min-h-[32rem]',
              )}
            />
          )}
          {showPreview && (
            <section
              aria-label={t('wiki.editor.preview')}
              className="min-h-[24rem] overflow-x-auto rounded-lg border border-slate-200 bg-white px-5 py-4 lg:min-h-[32rem] dark:border-slate-800 dark:bg-slate-900"
            >
              {content.trim() === '' ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('wiki.editor.previewEmpty')}
                </p>
              ) : (
                <MarkdownView>{content}</MarkdownView>
              )}
            </section>
          )}
        </div>
      </div>

      {saveError !== null && <ErrorNotice error={saveError} />}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {t('wiki.editor.save')}
        </Button>
        <Link to={article ? `/wiki/${article.id}` : '/wiki'} className={buttonClass('secondary')}>
          {t('common.cancel')}
        </Link>
      </div>
    </form>
  )
}
