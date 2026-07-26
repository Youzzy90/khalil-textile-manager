import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ColisListPage } from './pages/ColisListPage'
import { ColisFormPage } from './pages/ColisFormPage'
import { ColisDetailPage } from './pages/ColisDetailPage'
import { ClientsPage } from './pages/ClientsPage'
import { DestinatairesPage } from './pages/DestinatairesPage'
import { LivreursPage } from './pages/LivreursPage'
import { PaiementsPage } from './pages/PaiementsPage'
import { ComptabilitePage } from './pages/ComptabilitePage'
import { StocksPage } from './pages/StocksPage'
import { UtilisateursPage } from './pages/UtilisateursPage'
import { ParametresPage } from './pages/ParametresPage'
import { Loader2 } from 'lucide-react'

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Protected><AppShell /></Protected>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/colis" element={<ColisListPage />} />
            <Route path="/colis/nouveau" element={<ColisFormPage />} />
            <Route path="/colis/:id" element={<ColisDetailPage />} />
            <Route path="/colis/:id/modifier" element={<ColisFormPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/destinataires" element={<DestinatairesPage />} />
            <Route path="/livreurs" element={<LivreursPage />} />
            <Route path="/paiements" element={<PaiementsPage />} />
            <Route path="/comptabilite" element={<ComptabilitePage />} />
            <Route path="/stocks" element={<StocksPage />} />
            <Route path="/utilisateurs" element={<UtilisateursPage />} />
            <Route path="/parametres" element={<ParametresPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
