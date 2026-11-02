import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectEditDialog } from '@/components/projects/ProjectEditDialog'
import { ProjectDeleteDialog } from '@/components/projects/ProjectDeleteDialog'
import { fetchProject, type Project } from '@/lib/api'

interface ProjectDetailViewProps {
  projectId: string
}

function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showBanner = (message: string) => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current)
    }
    setSuccessBanner(message)
    bannerTimerRef.current = setTimeout(() => {
      setSuccessBanner(null)
      bannerTimerRef.current = null
    }, 6000)
  }

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current)
      }
    }
  }, [])

  const reloadProject = () => {
    setIsLoading(true)
    setError(null)

    fetchProject(projectId)
      .then((data) => {
        setProject(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load project details.')
        setIsLoading(false)
      })
  }

  // Load project on mount with stale-request cancellation protection
  useEffect(() => {
    let isCurrent = true

    fetchProject(projectId)
      .then((data) => {
        if (isCurrent) {
          setProject(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setError(
            err instanceof Error ? err.message : 'Failed to load project details.'
          )
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [projectId])

  const handleEditSuccess = (updatedProject: Project) => {
    setProject(updatedProject)
    showBanner(`Project "${updatedProject.name}" was updated successfully.`)
    setIsEditOpen(false)
  }

  const handleDeleteSuccess = () => {
    setIsDeleteOpen(false)
    navigate('/projects', {
      replace: true,
      state: {
        deletedProjectName: project?.name,
      },
    })
  }

  const formatDate = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-left">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Projects</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-foreground truncate max-w-xs">
            {project ? project.name : projectId}
          </span>
        </div>
      </div>

      {/* Success banner */}
      {successBanner && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading project details...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center shadow-sm">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h2 className="mt-2 text-base font-semibold text-destructive">
            {error.toLowerCase().includes('not found')
              ? 'Project Not Found'
              : 'Unable to Load Project'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">{error}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={reloadProject} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link to="/projects">Back to Projects</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Loaded Project View */}
      {!isLoading && !error && project && (
        <div className="space-y-6">
          {/* Header Title & Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground m-0">
                {project.name}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={project.targetUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 hover:text-primary hover:underline truncate"
                >
                  <span className="truncate">{project.targetUrl}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                aria-label={`Edit ${project.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                aria-label={`Delete ${project.name}`}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            </div>
          </div>

          {/* Project Overview Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground m-0">Project Overview</h2>
            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Project ID</dt>
                <dd className="mt-1 font-mono text-xs text-foreground select-all">{project.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Target URL</dt>
                <dd className="mt-1">
                  <a
                    href={project.targetUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline truncate max-w-full"
                  >
                    <span className="truncate">{project.targetUrl}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Created</dt>
                <dd className="mt-1 text-foreground">{formatDate(project.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Last Updated</dt>
                <dd className="mt-1 text-foreground">{formatDate(project.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Settings Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground m-0">Custom Settings</h2>
            <div className="mt-4">
              {project.settings && Object.keys(project.settings).length > 0 ? (
                <pre className="rounded-md border border-border bg-muted/40 p-4 font-mono text-xs text-foreground overflow-x-auto">
                  {JSON.stringify(project.settings, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No custom settings configured. Default scan configuration is applied.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="default" asChild>
              <Link to={`/scans/scan-${project.id}-latest`}>View Latest Scan</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/projects">Back to Projects</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Edit Project Dialog */}
      {project && (
        <ProjectEditDialog
          project={project}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Project Dialog */}
      {project && (
        <ProjectDeleteDialog
          project={project}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()

  if (!projectId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-left">
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center shadow-sm">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h2 className="mt-2 text-base font-semibold text-destructive">Invalid Project ID</h2>
          <p className="mt-1 text-sm text-muted-foreground">No project identifier was provided.</p>
          <Button variant="default" size="sm" asChild className="mt-4">
            <Link to="/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    )
  }

  return <ProjectDetailView key={projectId} projectId={projectId} />
}
