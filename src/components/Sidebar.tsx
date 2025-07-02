// src/components/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Users,
  User,
  LogOut,
  Home,
  X // Import X icon for close button
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../lib/colors'
import Logo from '../assets/logo.png'
import { ConfirmDialog } from './modal/DialogModal'
import { useState } from 'react'

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const location = useLocation()
  const { logout } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleLogoutClick = () => {
    setConfirmOpen(true)
  }

  const handleConfirmLogout = () => {
    logout()
    setConfirmOpen(false)
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/classes', icon: Users, label: 'Turmas' },
    //{ href: '/my-events', icon: Calendar, label: 'Meus Eventos' },
    { href: '/reports', icon: BarChart3, label: 'Relatórios' },
    { href: '/profile', icon: User, label: 'Perfil' },
  ]

  return (
    <aside
      className={`fixed top-0 left-0 w-64 h-screen shadow-xl flex flex-col border-r border-gray-200 bg-white
        transform transition-transform duration-200 ease-in-out z-50
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-8"> {/* Added justify-between */}
          <div className="flex items-center gap-3"> {/* Wrapped logo and text */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-md">
              <img src={Logo} alt="logo" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Sistema</h1>
              <p className="text-sm text-gray-600">Ignição</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg" // Close button for mobile
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-white font-medium shadow-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
                style={isActive ? { backgroundColor: colors.primary } : {}}
                onClick={toggleSidebar} // Close sidebar on navigation click
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        message="Tem certeza que deseja sair do sistema?"
        title="Confirmar Logout"
        confirmLabel="Sair"
        cancelLabel="Cancelar"
      />
    </aside>
  )
}
