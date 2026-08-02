import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, MapPin, Truck, CreditCard,
  BarChart3, Boxes, Shield, Settings, LogOut, X,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import type { Role } from '../types/db'

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; roles?: Role[] }

const NAV: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/colis', label: 'Colis', icon: Package },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/destinataires', label: 'Destinataires', icon: MapPin },
  { to: '/livreurs', label: 'Livreurs', icon: Truck },
  { to: '/paiements', label: 'Paiements', icon: CreditCard },
  { to: '/comptabilite', label: 'Comptabilité', icon: BarChart3, roles: ['ADMIN'] },
  { to: '/stocks', label: 'Stocks', icon: Boxes },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: Shield, roles: ['ADMIN'] },
  { to: '/parametres', label: 'Paramètres', icon: Settings, roles: ['ADMIN'] },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { utilisateur, signOut } = useAuth()
  const navigate = useNavigate()
  const role = utilisateur?.role ?? 'EMPLOYE'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} />}
      <aside className={`fixed md:sticky top-0 left-0 z-40 h-screen w-60 bg-[#0B0D11] border-r border-border
        flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/15 flex items-center justify-center text-gold-500 font-bold">K</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text-primary">Khalil Textile</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Manager</div>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.filter(n => !n.roles || n.roles.includes(role)).map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}>
              <item.icon size={18} /> <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 text-sm font-semibold">
              {utilisateur?.nom_complet?.[0] ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text-primary truncate">{utilisateur?.nom_complet ?? '—'}</div>
              <div className="text-xs text-text-muted">{role === 'ADMIN' ? 'Administrateur' : 'Employé'}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="sidebar-item w-full text-danger-500 hover:bg-danger-500/10">
            <LogOut size={18} /> <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
