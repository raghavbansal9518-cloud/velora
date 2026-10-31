import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
        404 Error
      </span>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground m-0">Page Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The requested URL was not found on the Velora platform.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="default" asChild>
          <Link to="/">Return to Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/projects">View Projects</Link>
        </Button>
      </div>
    </div>
  )
}
