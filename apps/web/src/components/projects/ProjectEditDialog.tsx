import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateProject, ApiError, type Project, type UpdateProjectInput } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface ProjectEditDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (updatedProject: Project) => void
}

interface FormErrors {
  name?: string
  targetUrl?: string
  settings?: string
}

interface ProjectEditModalProps {
  project: Project
  onOpenChange: (open: boolean) => void
  onSuccess: (updatedProject: Project) => void
}

function ProjectEditModal({ project, onOpenChange, onSuccess }: ProjectEditModalProps) {
  const [name, setName] = useState(project.name || '')
  const [targetUrl, setTargetUrl] = useState(project.targetUrl || '')
  const [settingsText, setSettingsText] = useState(
    project.settings ? JSON.stringify(project.settings, null, 2) : ''
  )
  const [clearSettings, setClearSettings] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(Boolean(project.settings))

  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Keyboard trap, focus management, and body scroll lock
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus name input on mount
    nameInputRef.current?.focus()

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

  // Clear specific field errors on change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }))
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetUrl(e.target.value)
    if (errors.targetUrl) {
      setErrors((prev) => ({ ...prev, targetUrl: undefined }))
    }
  }

  const handleSettingsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSettingsText(e.target.value)
    if (errors.settings) {
      setErrors((prev) => ({ ...prev, settings: undefined }))
    }
  }

  const handleClearSettingsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClearSettings(e.target.checked)
    if (errors.settings) {
      setErrors((prev) => ({ ...prev, settings: undefined }))
    }
  }

  // Backdrop click handler
  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmittingRef.current && !isSubmitting) {
      onOpenChange(false)
    }
  }

  // Client-side validation function
  const validateForm = (): {
    isValid: boolean
    data?: UpdateProjectInput
    validationErrors: FormErrors
  } => {
    const newErrors: FormErrors = {}

    // 1. Validate name
    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = 'Project name is required'
    } else if (trimmedName.length > 191) {
      newErrors.name = 'Project name cannot exceed 191 characters'
    }

    // 2. Validate targetUrl
    const trimmedUrl = targetUrl.trim()
    if (!trimmedUrl) {
      newErrors.targetUrl = 'Target URL is required'
    } else if (trimmedUrl.length > 2048) {
      newErrors.targetUrl = 'Target URL cannot exceed 2048 characters'
    } else {
      try {
        const parsed = new URL(trimmedUrl)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          newErrors.targetUrl = 'Target URL must use http: or https: protocol'
        } else if (parsed.username !== '' || parsed.password !== '') {
          newErrors.targetUrl =
            'Target URL must not contain embedded credentials (username or password)'
        }
      } catch {
        newErrors.targetUrl =
          'Target URL must be a valid, parseable URL (e.g. https://example.com)'
      }
    }

    // 3. Validate settings behavior
    let parsedSettings: Record<string, unknown> | null | undefined = undefined

    if (clearSettings) {
      // User explicitly opted to clear settings (send settings: null)
      parsedSettings = null
    } else {
      const trimmedSettings = settingsText.trim()
      if (trimmedSettings) {
        try {
          const parsed = JSON.parse(trimmedSettings)
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            newErrors.settings = 'Settings must be a valid JSON object (key-value pairs)'
          } else {
            parsedSettings = parsed as Record<string, unknown>
          }
        } catch (err) {
          newErrors.settings = `Settings must be valid JSON: ${err instanceof Error ? err.message : 'Invalid JSON'}`
        }
      } else {
        // An empty settings field without clearSettings checked is omitted from the request
        parsedSettings = undefined
      }
    }

    const isValid = Object.keys(newErrors).length === 0

    const updatePayload: UpdateProjectInput = {
      name: trimmedName,
      targetUrl: trimmedUrl,
    }

    if (clearSettings) {
      updatePayload.settings = null
    } else if (parsedSettings !== undefined) {
      updatePayload.settings = parsedSettings
    }

    return {
      isValid,
      data: isValid ? updatePayload : undefined,
      validationErrors: newErrors,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent duplicate submission synchronously via ref lock
    if (isSubmittingRef.current || isSubmitting) return

    setGeneralError(null)

    // Run client-side validation
    const { isValid, data, validationErrors } = validateForm()
    if (!isValid || !data) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      const updatedProject = await updateProject(project.id, data)

      // Notify parent and close dialog
      onSuccess(updatedProject)
      onOpenChange(false)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details) {
          // Map backend validation errors to fields
          setErrors({
            name: err.details.name,
            targetUrl: err.details.targetUrl,
            settings: err.details.settings,
          })
          if (err.details.body) {
            setGeneralError(err.details.body)
          }
        } else {
          setGeneralError(err.message)
        }
      } else {
        setGeneralError(
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-dialog-title"
        aria-describedby="edit-project-dialog-description"
        className="relative my-8 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl transition-all text-left"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div>
            <h2
              id="edit-project-dialog-title"
              className="text-xl font-semibold tracking-tight text-foreground m-0"
            >
              Edit Project
            </h2>
            <p
              id="edit-project-dialog-description"
              className="mt-1 text-sm text-muted-foreground"
            >
              Update project details, target URL, or scan settings.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            aria-label="Close edit dialog"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Error: </span>
              {generalError}
            </div>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-project-name"
              className="block text-sm font-medium text-foreground"
            >
              Project Name <span className="text-destructive">*</span>
            </label>
            <Input
              ref={nameInputRef}
              id="edit-project-name"
              name="name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Acme Marketing Storefront"
              maxLength={191}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'edit-project-name-error' : undefined}
              className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.name ? (
              <p id="edit-project-name-error" className="text-xs text-destructive mt-1">
                {errors.name}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                A recognizable name for your project (max 191 characters).
              </p>
            )}
          </div>

          {/* Target URL */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-project-url"
              className="block text-sm font-medium text-foreground"
            >
              Target URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-project-url"
              name="targetUrl"
              type="url"
              value={targetUrl}
              onChange={handleUrlChange}
              placeholder="https://example.com"
              maxLength={2048}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.targetUrl)}
              aria-describedby={errors.targetUrl ? 'edit-project-url-error' : undefined}
              className={errors.targetUrl ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.targetUrl ? (
              <p id="edit-project-url-error" className="text-xs text-destructive mt-1">
                {errors.targetUrl}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                The full HTTP or HTTPS URL to scan (max 2048 characters).
              </p>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              disabled={isSubmitting}
              aria-expanded={showAdvanced}
              aria-controls="edit-project-advanced-section"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              {showAdvanced ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <span>Advanced Settings (Optional JSON)</span>
            </button>

            {showAdvanced && (
              <div
                id="edit-project-advanced-section"
                className="mt-2 space-y-3 pl-5 border-l-2 border-border"
              >
                {/* Clear Settings Checkbox */}
                <div className="flex items-start gap-2 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="edit-project-clear-settings"
                    name="clearSettings"
                    checked={clearSettings}
                    onChange={handleClearSettingsToggle}
                    disabled={isSubmitting}
                    className="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-ring cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="space-y-0.5">
                    <label
                      htmlFor="edit-project-clear-settings"
                      className="text-xs font-medium text-foreground cursor-pointer select-none"
                    >
                      Clear existing settings (set to null)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Check this box to explicitly remove all custom settings for this project.
                    </p>
                  </div>
                </div>

                {/* Settings Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="edit-project-settings"
                      className="block text-xs font-medium text-muted-foreground"
                    >
                      Custom Project Settings (JSON)
                    </label>
                    {clearSettings && (
                      <span className="text-[11px] font-medium text-destructive">
                        Marked to be cleared
                      </span>
                    )}
                  </div>
                  <textarea
                    id="edit-project-settings"
                    name="settings"
                    rows={4}
                    value={settingsText}
                    onChange={handleSettingsChange}
                    placeholder={'{\n  "environment": "staging",\n  "viewport": { "width": 1280, "height": 800 }\n}'}
                    disabled={isSubmitting || clearSettings}
                    aria-invalid={Boolean(errors.settings)}
                    aria-describedby={errors.settings ? 'edit-project-settings-error' : undefined}
                    className={cn(
                      'flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                      errors.settings ? 'border-destructive focus-visible:ring-destructive' : '',
                      clearSettings ? 'bg-muted/30 opacity-60' : ''
                    )}
                  />
                  {errors.settings ? (
                    <p id="edit-project-settings-error" className="text-xs text-destructive mt-1">
                      {errors.settings}
                    </p>
                  ) : clearSettings ? (
                    <p className="text-xs text-muted-foreground italic">
                      Settings will be set to null on save. Uncheck above to keep or provide JSON.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Enter a JSON object. Leave empty to omit from request and keep settings unchanged.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ProjectEditDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: ProjectEditDialogProps) {
  if (!open) return null

  return createPortal(
    <ProjectEditModal
      key={`${project.id}-${project.updatedAt}`}
      project={project}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />,
    document.body
  )
}
