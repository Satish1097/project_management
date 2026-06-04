import { useRef, useState } from 'react'
import { FileText, Image, Paperclip, Trash2, Upload } from 'lucide-react'
import type { IssueAttachment } from '@/types/issues'
import { cn } from '@/utils/cn'

type PendingFile = IssueAttachment & { file?: File }

type AttachmentDropzoneProps = {
  attachments: PendingFile[]
  onChange: (files: PendingFile[]) => void
}

export function AttachmentDropzone({
  attachments,
  onChange,
}: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const next: PendingFile[] = [...attachments]
    for (const file of Array.from(fileList)) {
      const previewUrl = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined
      next.push({
        id: `att-${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        previewUrl,
        file,
      })
    }
    onChange(next)
  }

  const remove = (id: string) => {
    const item = attachments.find((a) => a.id === id)
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    onChange(attachments.filter((a) => a.id !== id))
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-devflow-text-secondary">Attachments</span>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-devflow-primary bg-[var(--df-nav-tint)]/40'
            : 'border-devflow-border bg-devflow-surface',
        )}
      >
        <Upload className="mb-2 size-6 text-devflow-text-muted" />
        <p className="text-caption text-devflow-text-secondary">
          Drag & drop screenshots, logs, or documents
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-caption font-medium text-devflow-primary hover:underline"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {attachments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-2 rounded-lg border border-devflow-border bg-devflow-card p-2"
            >
              {att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt=""
                  className="size-10 rounded object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded bg-devflow-muted">
                  {att.mimeType.startsWith('image/') ? (
                    <Image className="size-4 text-devflow-text-muted" />
                  ) : (
                    <FileText className="size-4 text-devflow-text-muted" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption text-devflow-text">{att.name}</p>
                <p className="text-caption text-devflow-text-muted">
                  {(att.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(att.id)}
                className="rounded p-1 text-devflow-text-muted hover:bg-devflow-surface hover:text-devflow-error"
                aria-label={`Remove ${att.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="flex items-center gap-1 text-caption text-devflow-text-muted">
        <Paperclip className="size-3" />
        Stored locally until backend upload is connected.
      </p>
    </div>
  )
}
