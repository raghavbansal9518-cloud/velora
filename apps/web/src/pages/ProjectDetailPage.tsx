import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-left">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/projects" className="hover:text-primary transition-colors">
            Projects
          </Link>
          <span>/</span>
          <span className="font-mono text-foreground">{projectId}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground m-0">Project Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configuration, baseline snapshots, and scan history for this project.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground m-0">Project Overview</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground">Project Identifier:</span>
            <span className="font-mono font-medium text-foreground">{projectId}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">Status:</span>
            <span className="text-green-500 font-medium">Ready for Scans</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="default" asChild>
            <Link to={`/scans/scan-${projectId}-latest`}>View Latest Scan</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
