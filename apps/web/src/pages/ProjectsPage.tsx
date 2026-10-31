import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ProjectsPage() {
  const sampleProjects = [
    { id: 'proj-ecommerce', name: 'E-commerce Website', description: 'Storefront visual regression checks' },
    { id: 'proj-saas', name: 'SaaS Dashboard', description: 'Responsive layout and navigation QA' },
    { id: 'proj-marketing', name: 'Marketing Landing Page', description: 'Landing page visual diff tracking' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-left">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground m-0">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your monitored websites and repositories. (Placeholder)
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {sampleProjects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/50"
          >
            <div>
              <h2 className="text-lg font-semibold text-foreground m-0">{project.name}</h2>
              <p className="text-sm text-muted-foreground">{project.description}</p>
              <span className="mt-2 inline-block font-mono text-xs text-muted-foreground">ID: {project.id}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/projects/${project.id}`}>View Project</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
