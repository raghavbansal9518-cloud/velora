import { useState, useEffect, useRef, useMemo } from 'react'
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
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

function matchesProject(project: Project, query: string): boolean {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return true

  // 1. Check project name
  if (project.name.toLowerCase().includes(trimmed)) return true

  // 2. Check full target URL
  const targetUrlLower = project.targetUrl.toLowerCase()
  if (targetUrlLower.includes(trimmed)) return true

  // 3. Check domain / hostname specifically
  try {
    const url = new URL(project.targetUrl)
    if (url.hostname.toLowerCase().includes(trimmed)) return true
  } catch {
    // Malformed URL safe fallback
  }

  return false
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

  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const lastPageRef = useRef(currentPage)
  const isSearchTriggeredPageResetRef = useRef(false)

  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestRequestIdRef = useRef(0)

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const isSearchActive = trimmedQuery.length > 0

  const filteredProjects = useMemo(() => {
    if (!isSearchActive) return projects
    return projects.filter((project) => matchesProject(project, trimmedQuery))
  }, [projects, isSearchActive, trimmedQuery])

  const showSearch =
    !isLoading && !error && (totalCount > 0 || projects.length > 0 || isSearchActive)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim().length > 0 && currentPage !== 1) {
      isSearchTriggeredPageResetRef.current = true
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', '1')
        return next
      })
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      clearSearch()
    }
  }

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
    const requestId = ++latestRequestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchProjects({ page: pageToLoad, limit: PAGE_SIZE })
      if (requestId !== latestRequestIdRef.current) return
      setProjects(result.projects)
      setTotalPages(result.pagination.totalPages)
      setTotalCount(result.pagination.total)

      // Clamp to last valid page if current page exceeds totalPages (and totalPages > 0)
      if (result.pagination.totalPages > 0 && pageToLoad > result.pagination.totalPages) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.set('page', String(result.pagination.totalPages))
            return next
          },
          { replace: true }
        )
      } else if (result.pagination.total === 0) {
        setSearchQuery('')
        setSearchParams(
          (prev) => {
            if (!prev.has('page')) return prev
            const next = new URLSearchParams(prev)
            next.delete('page')
            return next
          },
          { replace: true }
        )
      }
    } catch (err) {
      if (requestId !== latestRequestIdRef.current) return
      setError(
        err instanceof Error ? err.message : 'Failed to load projects. Please try again.'
      )
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    // Reset search when navigating to another page via browser history or clamping,
    // but preserve the query when search itself triggered the reset to page 1.
    if (isSearchTriggeredPageResetRef.current) {
      isSearchTriggeredPageResetRef.current = false
    } else if (lastPageRef.current !== currentPage) {
      setSearchQuery('')
    }
    lastPageRef.current = currentPage

    let isCurrent = true
    const requestId = ++latestRequestIdRef.current

    fetchProjects({ page: currentPage, limit: PAGE_SIZE })
      .then((result) => {
        if (isCurrent && requestId === latestRequestIdRef.current) {
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
          } else if (result.pagination.total === 0) {
            setSearchQuery('')
            setSearchParams(
              (prev) => {
                if (!prev.has('page')) return prev
                const next = new URLSearchParams(prev)
                next.delete('page')
                return next
              },
              { replace: true }
            )
          }
        }
      })
      .catch((err) => {
        if (isCurrent && requestId === latestRequestIdRef.current) {
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
    setSearchQuery('')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(targetPage))
      return next
    })
  }

  const handleRegisterSuccess = async (newProject: Project) => {
    setIsRegisterOpen(false)
    setSearchQuery('')
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

  const handleDeleteSuccess = async (deletedProjectId: string) => {
    const projectName =
      projectToDelete?.name ?? projects.find((p) => p.id === deletedProjectId)?.name
    setProjectToDelete(null)

    showBanner(
      projectName
        ? `Project "${projectName}" was deleted successfully.`
        : 'Project was deleted successfully.'
    )

    if (projects.length === 1 && currentPage > 1) {
      // The only project on the current page was deleted, and previous pages exist.
      // Navigate to the previous valid page (currentPage - 1).
      // Updating searchParams changes currentPage, which automatically triggers
      // the paginated fetch via useEffect without duplicate requests.
      setIsLoading(true)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(currentPage - 1))
        return next
      })
    } else {
      // Current page still contains projects or is page 1.
      // Reload current page to synchronize with backend (pulling next item from backend
      // if available to fill the page, and updating totalCount/totalPages).
      await reloadProjects(currentPage)
    }
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

      {/* Search Input Bar (when projects exist or search is active) */}
      {showSearch && (
        <div className="mb-6">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              id="project-search"
              type="text"
              placeholder="Search by name, URL, or domain..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search projects by name, URL, or domain"
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Search match indicator */}
          {isSearchActive && filteredProjects.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"
            >
              <span>
                {filteredProjects.length === 1
                  ? `Found 1 matching project on page ${currentPage}`
                  : `Found ${filteredProjects.length} matching projects on page ${currentPage} (out of ${projects.length})`}
              </span>
              <button
                type="button"
                onClick={clearSearch}
                className="font-medium text-primary hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}
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

      {/* Search empty state: projects exist on this page, but none match the search query */}
      {!isLoading && !error && isSearchActive && filteredProjects.length === 0 && projects.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-12 text-center shadow-sm"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground m-0">
            No Matching Projects Found
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            No projects on page {currentPage} matched &ldquo;{searchQuery.trim()}&rdquo;. Try checking for typos or searching with different keywords.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSearch}
            className="mt-5 gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>Clear Search</span>
          </Button>
        </div>
      )}

      {/* Projects list */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
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
      )}

      {/* Pagination controls */}
      {!isLoading && !error && projects.length > 0 && totalPages > 1 && (
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
