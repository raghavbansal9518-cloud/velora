import * as React from 'react'
import { useState, useRef } from 'react'
import { Plus, Loader2, AlertCircle, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createProject, ApiError, type Project } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface ProjectRegisterFormProps {
  onSuccess: (project: Project) => void
  onCancel: () => void
  className?: string
}

interface FormErrors {
  name?: string
  targetUrl?: string
  settings?: string
}

export function ProjectRegisterForm({
  onSuccess,
  onCancel,
  className,
}: ProjectRegisterFormProps) {
  const [name, setName] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [settingsText, setSettingsText] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  // Clear specific field error when user modifies that field
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

  // Client-side validation function
  const validateForm = (): {
    isValid: boolean
    data?: {
      name: string
      targetUrl: string
      settings?: Record<string, unknown>
    }
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
        newErrors.targetUrl = 'Target URL must be a valid, parseable URL (e.g. https://example.com)'
      }
    }

    // 3. Validate settings (optional)
    let parsedSettings: Record<string, unknown> | undefined = undefined
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
    }

    const isValid = Object.keys(newErrors).length === 0

    return {
      isValid,
      data: isValid
        ? {
            name: trimmedName,
            targetUrl: trimmedUrl,
            settings: parsedSettings,
          }
        : undefined,
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
      const createdProject = await createProject(data)

      // Reset form
      setName('')
      setTargetUrl('')
      setSettingsText('')
      setShowAdvanced(false)
      setErrors({})
      setGeneralError(null)

      // Notify parent
      onSuccess(createdProject)
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
      className={cn(
        'rounded-lg border border-border bg-card p-6 shadow-sm transition-all text-left',
        className
      )}
    >
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground m-0">
            Register New Project
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a website or web application to monitor for visual regressions.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Close registration form"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

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

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Project Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-name"
            className="block text-sm font-medium text-foreground"
          >
            Project Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="project-name"
            name="name"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Acme Marketing Storefront"
            maxLength={191}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'project-name-error' : undefined}
            className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.name ? (
            <p id="project-name-error" className="text-xs text-destructive mt-1">
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
            htmlFor="project-url"
            className="block text-sm font-medium text-foreground"
          >
            Target URL <span className="text-destructive">*</span>
          </label>
          <Input
            id="project-url"
            name="targetUrl"
            type="url"
            value={targetUrl}
            onChange={handleUrlChange}
            placeholder="https://example.com"
            maxLength={2048}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.targetUrl)}
            aria-describedby={errors.targetUrl ? 'project-url-error' : undefined}
            className={errors.targetUrl ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.targetUrl ? (
            <p id="project-url-error" className="text-xs text-destructive mt-1">
              {errors.targetUrl}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              The full HTTP or HTTPS URL to scan (max 2048 characters).
            </p>
          )}
        </div>

        {/* Advanced Settings Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            disabled={isSubmitting}
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
            <div className="mt-2 space-y-1.5 pl-5 border-l-2 border-border">
              <label
                htmlFor="project-settings"
                className="block text-xs font-medium text-muted-foreground"
              >
                Custom Project Settings
              </label>
              <textarea
                id="project-settings"
                name="settings"
                rows={4}
                value={settingsText}
                onChange={handleSettingsChange}
                placeholder={'{\n  "environment": "staging",\n  "viewport": { "width": 1280, "height": 800 }\n}'}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.settings)}
                aria-describedby={errors.settings ? 'project-settings-error' : undefined}
                className={cn(
                  'flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                  errors.settings ? 'border-destructive focus-visible:ring-destructive' : ''
                )}
              />
              {errors.settings ? (
                <p id="project-settings-error" className="text-xs text-destructive mt-1">
                  {errors.settings}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Optional key-value JSON object for custom scan configurations.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Register Project</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
