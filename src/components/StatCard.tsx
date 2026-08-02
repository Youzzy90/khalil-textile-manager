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
      className={`card p-4 text-left animate-slideUp transition-all duration-200
        ${onClick ? 'hover:border-gold-500/50 hover:shadow-glow cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</div>
          <div className={`mt-1.5 font-mono font-semibold ${accent ? 'text-gold-500 text-2xl' : 'text-text-primary text-xl'}`}>
            {value}
          </div>
        </div>
        <div className={`shrink-0 p-2 rounded-lg ${accent ? 'bg-gold-500/15 text-gold-500' : 'bg-bg-hover text-text-secondary'}`}>
          <Icon size={20} />
        </div>
      </div>
      {variation !== undefined && variation !== null && (
        <div className={`mt-2 text-xs font-medium ${positive ? 'text-success-500' : 'text-danger-500'}`}>
          {positive ? '▲' : '▼'} {Math.abs(variation).toFixed(0)}% vs hier
        </div>
      )}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-4 ${className}`}>{children}</div>
}
