import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-left">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/projects" className="hover:text-primary transition-colors">
            Projects
          </Link>
          <span>/</span>
          <span>Scans</span>
          <span>/</span>
          <span className="font-mono text-foreground">{scanId}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground m-0">Scan Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visual comparison, regression analysis, and source code investigation.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground m-0">Scan Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground">Scan Identifier:</span>
            <span className="font-mono font-medium text-foreground">{scanId}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">Execution Status:</span>
            <span className="text-blue-500 font-medium">Placeholder (Phase 2 Comparison Engine)</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/projects">Back to Projects</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
