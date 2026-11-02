import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Globe,
  CheckCircle2,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectRegisterForm } from '@/components/projects/ProjectRegisterForm'
import { ProjectEditDialog } from '@/components/projects/ProjectEditDialog'
import { ProjectDeleteDialog } from '@/components/projects/ProjectDeleteDialog'
import { fetchProjects, type Project } from '@/lib/api'

const PAGE_SIZE = 10

function parsePageParam(rawPage: string | null): number {
  if (!rawPage) return 1
  const trimmed = rawPage.trim()
  if (!/^[1-9]\d*$/.test(trimmed)) return 1
  const num = Number(trimmed)
  if (!Number.isSafeInteger(num) || num < 1) return 1
  return num
}

export function ProjectsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentPage = parsePageParam(searchParams.get('page'))

  const [projects, setProjects] = useState<Project[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

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

  // Consume deleted project notification from navigation state
  useEffect(() => {
    const navState = location.state as { deletedProjectName?: string } | null
    if (navState?.deletedProjectName) {
      const projectName = navState.deletedProjectName
      navigate('/projects', { replace: true, state: {} })
      const timer = setTimeout(() => {
        showBanner(`Project "${projectName}" was deleted successfully.`)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [location.state, navigate])

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current)
      }
    }
  }, [])

  const reloadProjects = async (targetPage?: number) => {
    const pageToLoad = typeof targetPage === 'number' ? targetPage : currentPage
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchProjects({ page: pageToLoad, limit: PAGE_SIZE })
      setProjects(result.projects)
      setTotalPages(result.pagination.totalPages)
      setTotalCount(result.pagination.total)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load projects. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCurrent = true

    fetchProjects({ page: currentPage, limit: PAGE_SIZE })
      .then((result) => {
        if (isCurrent) {
          setProjects(result.projects)
          setTotalPages(result.pagination.totalPages)
          setTotalCount(result.pagination.total)
          setIsLoading(false)

          // Clamp to last valid page if current page exceeds totalPages (and totalPages > 0)
          if (result.pagination.totalPages > 0 && currentPage > result.pagination.totalPages) {
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev)
                next.set('page', String(result.pagination.totalPages))
                return next
              },
              { replace: true }
            )
          }
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setError(
            err instanceof Error ? err.message : 'Failed to load projects. Please try again.'
          )
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [currentPage, setSearchParams])

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || (totalPages > 0 && targetPage > totalPages) || targetPage === currentPage) {
      return
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(targetPage))
      return next
    })
  }

  const handleRegisterSuccess = async (newProject: Project) => {
    setIsRegisterOpen(false)
    showBanner(`Project "${newProject.name}" was registered successfully.`)

    if (currentPage !== 1) {
      // Return to page 1 where the newly created project appears at the top
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', '1')
        return next
      })
    } else {
      await reloadProjects(1)
    }
  }

  const handleEditSuccess = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    )
    showBanner(`Project "${updatedProject.name}" was updated successfully.`)
    setProjectToEdit(null)
  }

  const handleDeleteSuccess = (deletedProjectId: string) => {
    const deletedProject = projects.find((p) => p.id === deletedProjectId)
    const projectName = deletedProject ? deletedProject.name : undefined
    setProjects((prev) => prev.filter((p) => p.id !== deletedProjectId))
    showBanner(
      projectName
        ? `Project "${projectName}" was deleted successfully.`
        : 'Project was deleted successfully.'
    )
    setProjectToDelete(null)
  }

  const formatDate = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  const showingStart = projects.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const showingEnd = Math.min((currentPage - 1) * PAGE_SIZE + projects.length, totalCount)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-left">
      {/* Header section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground m-0">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage monitored websites and applications for visual regression testing.
          </p>
        </div>
        {!isRegisterOpen && (
          <div>
            <Button
              variant="default"
              onClick={() => setIsRegisterOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>
        )}
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

      {/* Registration card (collapsible) */}
      {isRegisterOpen && (
        <div className="mb-6">
          <ProjectRegisterForm
            onSuccess={handleRegisterSuccess}
            onCancel={() => setIsRegisterOpen(false)}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading projects...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center shadow-sm">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h2 className="mt-2 text-base font-semibold text-destructive">Unable to Load Projects</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reloadProjects()}
            className="mt-4 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {/* Empty state: No projects in database */}
      {!isLoading && !error && projects.length === 0 && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-12 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Globe className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground m-0">No Projects Found</h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            You haven't registered any projects yet. Add your first website to start monitoring visual changes.
          </p>
          {!isRegisterOpen && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsRegisterOpen(true)}
              className="mt-5"
            >
              <Plus className="h-4 w-4" />
              <span>Register First Project</span>
            </Button>
          )}
        </div>
      )}

      {/* Empty state: Current page has no projects, but projects exist in database */}
      {!isLoading && !error && projects.length === 0 && totalCount > 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-12 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Globe className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground m-0">No Projects on This Page</h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            Page {currentPage} contains no projects. Total projects registered: {totalCount}.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => goToPage(1)}
            className="mt-5"
          >
            <span>Go to Page 1</span>
          </Button>
        </div>
      )}

      {/* Projects list */}
      {!isLoading && !error && projects.length > 0 && (
        <>
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground truncate m-0">
                      {project.name}
                    </h2>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <a
                      href={project.targetUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:text-primary hover:underline truncate"
                    >
                      {project.targetUrl}
                    </a>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">ID: {project.id}</span>
                    <span>&bull;</span>
                    <span>Created {formatDate(project.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProjectToEdit(project)}
                    aria-label={`Edit ${project.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProjectToDelete(project)}
                    aria-label={`Delete ${project.name}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/projects/${project.id}`}>View Project</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <nav
              role="navigation"
              aria-label="Pagination Navigation"
              className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 text-sm"
            >
              <div className="text-xs text-muted-foreground">
                Showing {showingStart}–{showingEnd} of {totalCount} projects
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  aria-label="Go to previous page"
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                <span className="px-2 text-xs font-medium text-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  aria-label="Go to next page"
                  className="gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          )}
        </>
      )}

      {/* Edit Project Dialog */}
      {projectToEdit && (
        <ProjectEditDialog
          project={projectToEdit}
          open={Boolean(projectToEdit)}
          onOpenChange={(open) => {
            if (!open) setProjectToEdit(null)
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Project Dialog */}
      {projectToDelete && (
        <ProjectDeleteDialog
          project={projectToDelete}
          open={Boolean(projectToDelete)}
          onOpenChange={(open) => {
            if (!open) setProjectToDelete(null)
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
