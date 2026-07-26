import { ReactNode } from 'react'
import { Plus, Search } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  search?: { value: string; onChange: (v: string) => void; placeholder?: string }
  actions?: ReactNode
  onAdd?: () => void
  addLabel?: string
}

export function PageHeader({ title, subtitle, search, actions, onAdd, addLabel = 'Nouveau' }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {search && (
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="input pl-10 w-64 bg-bg-soft/80"
              placeholder={search.placeholder ?? 'Rechercher…'}
              value={search.value}
              onChange={e => search.onChange(e.target.value)}
            />
          </div>
        )}
        {actions}
        {onAdd && (
          <button onClick={onAdd} className="btn-primary">
            <Plus size={16} /> {addLabel}
          </button>
        )}
      </div>
    </div>
  )
}
