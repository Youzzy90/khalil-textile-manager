import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  variation?: number | null
  onClick?: () => void
  accent?: boolean
}

export function StatCard({ label, value, icon: Icon, variation, onClick, accent }: StatCardProps) {
  const positive = (variation ?? 0) >= 0
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`card card-hover p-4 text-left animate-slideUp bg-stat-grad overflow-hidden group
        ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">{label}</div>
          <div className={`mt-2 font-mono font-bold tracking-tight ${accent ? 'text-gold-500 text-2xl' : 'text-text-primary text-xl'}`}>
            {value}
          </div>
        </div>
        <div className={`shrink-0 p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110
          ${accent ? 'bg-gold-500/15 text-gold-500 ring-1 ring-gold-500/20' : 'bg-bg-hover text-text-secondary'}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      {variation !== undefined && variation !== null && (
        <div className={`mt-3 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
          ${positive ? 'text-success-500 bg-success-500/10' : 'text-danger-500 bg-danger-500/10'}`}>
          <span>{positive ? '▲' : '▼'}</span> {Math.abs(variation).toFixed(0)}% <span className="text-text-muted font-normal">vs hier</span>
        </div>
      )}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>
}
