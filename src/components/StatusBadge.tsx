import { ColisStatut } from '../types/db'
import { STATUT_LABELS, STATUT_COLORS } from '../lib/labels'

export function StatusBadge({ statut }: { statut: ColisStatut }) {
  return (
    <span className={`badge ${STATUT_COLORS[statut]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUT_LABELS[statut]}
    </span>
  )
}
