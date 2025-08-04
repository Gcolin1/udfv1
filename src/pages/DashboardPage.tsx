
import { Link } from 'react-router-dom'
import { Users, Calendar, BookOpen, Activity } from 'lucide-react'

import { useInstructorStats } from '../hooks/useInstructorStats'
import { useAuth } from '../contexts/AuthContext'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { PageLoading, ErrorMessage } from '../components/ui'
import { formatCompactNumber } from '../utils/formatters'
import { BadgeCard } from '@/components/Levels/BadgeCard'
import { createBadgeCardData } from '../utils/badgeUtils'

interface StatCardProps {
  icon: typeof Users
  value: number
  label: string
  color: string
}

function StatCard({ icon: Icon, value, label, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 min-h-[100px] sm:min-h-[120px] flex flex-col">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 truncate">
          {formatCompactNumber(value)}
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm truncate" title={label}>
          {label}
        </p>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { 
    stats: instructorStats, 
    isLoading, 
    error,
    refetch
  } = useInstructorStats()

  const quickActions = [
    {
      title: "Ver Turmas",
      description: "Turmas sincronizadas",
      icon: Users,
      color: "bg-blue-50 hover:bg-blue-100 text-blue-600",
      link: "/classes"
    }
  ]

  if (isLoading) {
    return <PageLoading message="Carregando dashboard..." />
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Erro ao carregar dashboard"
        message={error}
        onRetry={refetch}
      />
    )
  }

  const allBadges = createBadgeCardData(instructorStats)
  // Show only "Pioneiro" and "Formador de Turmas" badges on dashboard
  const dashboardBadges = allBadges.filter(badge => 
    badge.id === 'pioneiro' || badge.id === 'formador-de-turmas'
  )

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <main className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Olá, {user?.name}! 👋
              </h2>
              <p className="text-gray-600">
                Aqui está um resumo das suas atividades no Sistema Ignição
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              <StatCard 
                icon={Users} 
                value={instructorStats.classes} 
                label="Turmas Criadas" 
                color="bg-blue-500" 
              />
              <StatCard 
                icon={BookOpen} 
                value={instructorStats.students} 
                label="Alunos Total" 
                color="bg-purple-500" 
              />
              <StatCard 
                icon={Activity} 
                value={instructorStats.matches} 
                label="Partidas Realizadas" 
                color="bg-orange-500" 
              />
              <StatCard 
                icon={Calendar} 
                value={instructorStats.events} 
                label="Eventos Organizados" 
                color="bg-green-500" 
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Ações Rápidas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className={`p-4 sm:p-6 rounded-lg transition-all duration-200 text-left hover:scale-105 active:scale-95 ${action.color} min-h-[120px] flex flex-col justify-center`}
                  >
                    <action.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-3 flex-shrink-0" />
                    <h4 className="font-medium mb-1 text-sm sm:text-base">{action.title}</h4>
                    <p className="text-xs sm:text-sm opacity-80">{action.description}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Minhas conquistas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dashboardBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}