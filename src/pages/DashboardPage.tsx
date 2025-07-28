
import { Link } from 'react-router-dom'
import { Users, Calendar, BookOpen, Activity } from 'lucide-react'

import { useDashboardStats } from '../hooks'
import { useAuth } from '../contexts/AuthContext'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { PageLoading, ErrorMessage, CustomTooltip } from '../components/ui'
import { formatCompactNumber, formatNumber } from '../utils/formatters'
import { BadgeCard } from '@/components/Levels/BadgeCard'

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
  const { stats, isLoading, error, refetch } = useDashboardStats()

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

  const badges = [
  {
    id: 'formador-turmas',
    title: 'Formador de Turmas',
    current: stats.classes,
    stages: [10, 25, 50, 100, 250],
    unit: 'Turmas',
  },
  {
    id: 'construtor-lideres',
    title: 'Construtor de Líderes',
    current: stats.leaders,
    stages: [10, 25, 50, 100, 250],
    unit: 'Líderes',
  },
  {
    id: 'mestre-alunos',
    title: 'Mestre de Alunos',
    current: stats.students,
    stages: [10, 25, 50, 100, 250],
    unit: 'Alunos',
  },
  {
    id: 'fontes-abundantes',
    title: 'Fontes Abundantes',
    current: stats.totalProfit,
    stages: [500, 1500, 2500, 3500, 5000],
    unit: 'R$',
  },
  {
    id: 'vendedor-nato',
    title: 'Vendedor Nato',
    current: stats.packagesSold,
    stages: [10, 25, 50, 100, 250],
    unit: 'Pacotes',
  },
  {
    id: 'lider-carismatico',
    title: 'Líder Carismático',
    current: stats.engagement,
    stages: [35, 55, 70, 80, 95],
    unit: '% de Engajamento',
  }
]

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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              <StatCard 
                icon={Users} 
                value={stats.classes} 
                label="Turmas Ativas" 
                color="bg-blue-500" 
              />
              <StatCard 
                icon={BookOpen} 
                value={stats.students} 
                label="Alunos Total" 
                color="bg-purple-500" 
              />
              <StatCard 
                icon={Activity} 
                value={stats.matches} 
                label="Partidas Totais" 
                color="bg-orange-500" 
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
                Conquistas do Instrutor
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge) => (
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