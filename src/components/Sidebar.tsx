import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, MapPin, Truck, CreditCard,
  BarChart3, Route, Shield, Settings, LogOut, X, Sparkles,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import type { Role } from '../types/db'

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; roles?: Role[]; section: string }

const NAV: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, section: 'Pilotage' },
  { to: '/colis', label: 'Colis', icon: Package, section: 'Opérations' },
  { to: '/clients', label: 'Clients', icon: Users, section: 'Opérations' },
  { to: '/destinataires', label: 'Destinataires', icon: MapPin, section: 'Opérations' },
  { to: '/livreurs', label: 'Livreurs', icon: Truck, section: 'Opérations' },
  { to: '/paiements', label: 'Paiements', icon: CreditCard, section: 'Finance' },
  { to: '/comptabilite', label: 'Comptabilité', icon: BarChart3, roles: ['ADMIN'], section: 'Finance' },
  { to: '/tournees', label: 'Tournées', icon: Route, section: 'Opérations' },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: Shield, roles: ['ADMIN'], section: 'Gestion' },
  { to: '/parametres', label: 'Paramètres', icon: Settings, roles: ['ADMIN'], section: 'Gestion' },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { utilisateur, signOut } = useAuth()
  const navigate = useNavigate()
  const role = utilisateur?.role ?? 'EMPLOYE'
  const items = NAV.filter(n => !n.roles || n.roles.includes(role))
  const sections = Array.from(new Set(items.map(i => i.section)))

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden animate-fadeIn" onClick={onClose} />}
      <aside className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar-grad bg-panel-grad border-r border-border
        flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gold-grad flex items-center justify-center text-black font-bold shadow-glow">
              K
              <Sparkles size={10} className="absolute -top-1 -right-1 text-gold-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-text-primary tracking-tight">Khalil Textile</div>
              <div className="text-[10px] text-gold-500/80 uppercase tracking-[0.15em] font-medium">Manager</div>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden btn-ghost p-1.5"><X size={18} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2">
          {sections.map(section => (
            <div key={section}>
              <div className="section-title">{section}</div>
              {items.filter(i => i.section === section).map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}>
                  <item.icon size={18} strokeWidth={2} /> <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="px-2.5 py-3 border-t border-border">
          <div className="flex items-center gap-3 mb-2 px-2 py-2 rounded-lg hover:bg-bg-hover/50 transition">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gold-500/15 ring-1 ring-gold-500/30 flex items-center justify-center text-gold-500 text-sm font-semibold">
                {utilisateur?.nom_complet?.[0] ?? '?'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success-500 rounded-full ring-2 ring-bg-base" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text-primary truncate">{utilisateur?.nom_complet ?? '—'}</div>
              <div className="text-[11px] text-text-muted flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-gold-500" />
                {role === 'ADMIN' ? 'Administrateur' : 'Employé'}
              </div>
            </div>
          </div>
          <button onClick={handleSignOut} className="sidebar-item w-full text-danger-500 hover:bg-danger-500/10 hover:text-danger-300">
            <LogOut size={18} /> <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
