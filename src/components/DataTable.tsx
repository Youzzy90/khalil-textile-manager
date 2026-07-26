import { ReactNode, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  pageSize?: number
  emptyMessage?: string
  initialSort?: { key: string; dir: 'asc' | 'desc' }
}

export function DataTable<T>({
  columns, rows, rowKey, onRowClick, pageSize = 50, emptyMessage = 'Aucune donnée', initialSort,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find(c => c.key === sort.key)
    if (!col?.sortValue) return rows
    const arr = [...rows].sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      if (va < vb) return sort.dir === 'asc' ? -1 : 1
      if (va > vb) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [rows, sort, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, totalPages - 1)
  const pageRows = sorted.slice(current * pageSize, (current + 1) * pageSize)

  function toggleSort(key: string) {
    setSort(prev => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} className={`th ${c.sortValue ? 'cursor-pointer select-none hover:text-text-primary' : ''} ${c.className ?? ''}`}
                    onClick={() => c.sortValue && toggleSort(c.key)}>
                  <div className="flex items-center gap-1.5">
                    {c.header}
                    {c.sortValue && (
                      sort?.key === c.key
                        ? (sort.dir === 'asc' ? <ArrowUp size={12} className="text-gold-500" /> : <ArrowDown size={12} className="text-gold-500" />)
                        : <ArrowUpDown size={12} className="opacity-30" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={columns.length} className="td text-center text-text-muted py-16">{emptyMessage}</td></tr>
            ) : (
              pageRows.map(row => (
                <tr key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={`table-row group ${onRowClick ? 'cursor-pointer' : ''}`}>
                  {columns.map(c => (
                    <td key={c.key} className={`td ${c.className ?? ''} group-hover:text-text-primary`}>{c.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 text-sm text-text-secondary border-t border-border-soft">
          <div className="text-xs">{(current * pageSize) + 1}–{Math.min((current + 1) * pageSize, sorted.length)} sur {sorted.length}</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={current === 0}
              className="btn-ghost p-1.5 rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span className="px-3 py-1 font-mono text-xs rounded-md bg-bg-soft">Page {current + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={current >= totalPages - 1}
              className="btn-ghost p-1.5 rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
