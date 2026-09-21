import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

interface ModalProps {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

/** Modal dialog: Radix provides the focus trap, Escape/backdrop close and focus restoration. */
export function Modal({ title, description, onClose, children }: ModalProps) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
        <Dialog.Content
          // Radix warns about a missing description unless it is opted out explicitly.
          {...(description ? {} : { 'aria-describedby': undefined })}
          className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl outline-none dark:bg-slate-900 dark:text-slate-100"
        >
          <Dialog.Title className="mb-4 text-lg font-semibold">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mb-6 -mt-2 text-sm break-words text-slate-600 dark:text-slate-400">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
