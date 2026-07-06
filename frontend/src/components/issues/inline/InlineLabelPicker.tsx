import { useMemo, useState } from 'react'
import { Plus, Tag, X } from 'lucide-react'
import { createProjectLabel } from '@/api/labels'
import { InlineDropdown } from '@/components/issues/inline/InlineDropdown'
import { INLINE_CELL_TRIGGER } from '@/components/issues/backlogTableLayout'
import { LabelBadge } from '@/components/ui/LabelBadge'
import { useProjectLabelsData } from '@/hooks/useProjectLabelsData'
import { getLabels, addLabel } from '@/services/labelsRegistry'
import { addProjectLabelToStore } from '@/services/projectLabelsStore'
import { showToast } from '@/features/toast/toast'
import { ApiError } from '@/api/types'
import { cn } from '@/utils/cn'

type InlineLabelPickerProps = {
  projectId: string
  value: string[]
  labelNames?: string[]
  onChange: (labelIds: string[], labelNames: string[]) => void
  disabled?: boolean
  allowCreate?: boolean
  cell?: boolean
  className?: string
}

type LabelOption = {
  id: string
  name: string
}

export function InlineLabelPicker({
  projectId,
  value,
  labelNames,
  onChange,
  disabled = false,
  allowCreate = true,
  cell = false,
  className,
}: InlineLabelPickerProps) {
  const [mockLabels, setMockLabels] = useState(() => getLabels())
  const [createName, setCreateName] = useState('')

  const useApi = Boolean(projectId)
  const { labels: apiLabels, loading } = useProjectLabelsData(projectId)

  const allLabels = useMemo<LabelOption[]>(() => {
    if (useApi) {
      return apiLabels.map((label) => ({ id: label.id, name: label.name }))
    }
    return mockLabels.map((name) => ({ id: name, name }))
  }, [apiLabels, mockLabels, useApi])

  const resolvedNames = useMemo(() => {
    if (labelNames && labelNames.length > 0) return labelNames
    return value.map((id) => allLabels.find((label) => label.id === id)?.name ?? id)
  }, [allLabels, labelNames, value])

  const available = useMemo(
    () => allLabels.filter((label) => !value.includes(label.id)),
    [allLabels, value],
  )

  const addLabelId = (labelId: string) => {
    const label = allLabels.find((item) => item.id === labelId)
    if (!label || value.includes(labelId)) return
    onChange([...value, labelId], [...resolvedNames, label.name])
  }

  const removeLabelId = (labelId: string) => {
    const nextIds = value.filter((id) => id !== labelId)
    const nextNames = resolvedNames.filter((_, index) => value[index] !== labelId)
    onChange(nextIds, nextNames)
  }

  const handleCreate = async () => {
    const trimmed = createName.trim()
    if (!trimmed) return

    if (useApi && allowCreate) {
      try {
        const created = await createProjectLabel(projectId, {
          name: trimmed,
          color: '#6366f1',
        })
        addProjectLabelToStore(projectId, created)
        onChange([...value, created.id], [...resolvedNames, created.name])
        setCreateName('')
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to create label.'
        showToast(message, 'error')
      }
      return
    }

    const created = addLabel(trimmed)
    if (created) {
      setMockLabels(getLabels())
      onChange([...value, created], [...resolvedNames, created])
      setCreateName('')
    }
  }

  const options = available.map((label) => ({
    id: label.id,
    label: label.name,
    keywords: label.name,
    icon: <Tag className="size-3.5 text-devflow-text-muted" />,
  }))

  return (
    <div
      className={cn(
        'min-w-0',
        cell
          ? 'flex h-7 w-full flex-wrap items-center gap-0.5 overflow-hidden'
          : 'inline-flex flex-wrap items-center gap-1',
        className,
      )}
    >
      {resolvedNames.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="inline-flex max-w-full items-center gap-0.5"
          onClick={(event) => event.stopPropagation()}
          title={name}
        >
          <span className="max-w-[5.5rem] truncate">
            <LabelBadge label={name} />
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => removeLabelId(value[index])}
            className={cn(
              'rounded p-0.5 text-devflow-text-muted hover:bg-devflow-muted hover:text-devflow-text',
              cell && 'opacity-0 group-hover:opacity-100',
            )}
            aria-label={`Remove ${name}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <InlineDropdown
        disabled={disabled}
        fullWidth={false}
        searchable
        searchPlaceholder="Search labels…"
        emptyMessage={loading ? 'Loading labels…' : 'No labels found'}
        options={options}
        onSelect={addLabelId}
        footer={
          allowCreate ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Create label"
                className="min-w-0 flex-1 rounded-md border border-devflow-border bg-devflow-card px-2 py-1 text-input outline-none focus:border-devflow-primary"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleCreate()
                  }
                }}
              />
              <button
                type="button"
                onClick={() => void handleCreate()}
                className="inline-flex items-center gap-1 rounded-md bg-devflow-primary px-2 py-1 text-caption text-white"
              >
                <Plus className="size-3" />
                Add
              </button>
            </div>
          ) : undefined
        }
        trigger={
          <span
            className={cn(
              cell
                ? cn(INLINE_CELL_TRIGGER, 'w-auto shrink-0 px-1')
                : 'inline-flex items-center gap-1 rounded-md border border-dashed border-devflow-border px-2 py-0.5 text-caption text-devflow-text-muted hover:border-devflow-primary/40 hover:text-devflow-primary',
            )}
            title="Add label"
          >
            <Plus className="size-3" />
            {!cell && value.length === 0 ? 'Labels' : null}
          </span>
        }
      />
    </div>
  )
}
