import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteProject, ApiError, type Project } from '@/lib/api'

export interface ProjectDeleteDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (deletedProjectId: string) => void
}

interface ProjectDeleteModalProps {
  project: Project
  onOpenChange: (open: boolean) => void
  onSuccess: (deletedProjectId: string) => void
}

function ProjectDeleteModal({ project, onOpenChange, onSuccess }: ProjectDeleteModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus cancel button by default for safety on destructive dialogs
    cancelButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!isSubmittingRef.current) {
          onOpenChange(false)
        }
        return
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length > 0) {
          const first = focusableElements[0]
          const last = focusableElements[focusableElements.length - 1]
          if (first && last) {
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault()
              last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault()
              first.focus()
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      previouslyFocused?.focus?.()
    }
  }, [onOpenChange])

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmittingRef.current && !isSubmitting) {
      onOpenChange(false)
    }
  }

  const handleDelete = async () => {
    if (isSubmittingRef.current || isSubmitting) return

    setError(null)
    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      const deletedId = await deleteProject(project.id)
      onSuccess(deletedId)
      onOpenChange(false)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
        )
      }
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-project-dialog-title"
        aria-describedby="delete-project-dialog-description"
        className="relative my-8 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl transition-all text-left"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="delete-project-dialog-title"
                className="text-lg font-semibold tracking-tight text-foreground m-0"
              >
                Delete Project?
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanent deletion confirmation
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            aria-label="Close delete dialog"
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content & Warning */}
        <div className="space-y-3 pt-2 pb-4">
          <p id="delete-project-dialog-description" className="text-sm text-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">"{project.name}"</span>?
          </p>
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive space-y-1">
            <p className="font-semibold">Warning: This action cannot be undone.</p>
            <p className="text-destructive/90">
              All associated visual regression scans, historical screenshots, comparison diffs, and settings will be permanently deleted due to backend cascade rules.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Error: </span>
              {error}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="min-w-[130px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Project</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProjectDeleteDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: ProjectDeleteDialogProps) {
  if (!open) return null

  return createPortal(
    <ProjectDeleteModal
      key={project.id}
      project={project}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />,
    document.body
  )
}
