// src/pages/DashboardPage.tsx
import { useAuth } from '../contexts/AuthContext'
import {
  Users,
  Calendar,
  BookOpen,
  Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface DashboardStats {
  classes: number
  events: number
  students: number
  matches: number
}

export function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    classes: 0,
    events: 0,
    students: 0,
    matches: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('📊 DashboardPage useEffect - user:', !!user, 'authLoading:', authLoading)
    
    if (authLoading) return

    if (user?.id) {
      console.log('✅ User available, loading stats')
      loadStats()
    } else {
      console.log('❌ No user, skipping stats')
      setIsLoading(false)
    }
  }, [authLoading, user?.id])

  const loadStats = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', user.id)

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', user.id)

      const { data: classIds } = await supabase
        .from('classes')
        .select('id')
        .eq('instructor_id', user.id)

      let studentsCount = 0
      let matchesCount = 0

      if (classIds?.length) {
        const ids = classIds.map(c => c.id)

        const { count } = await supabase
          .from('class_players')
          .select('*', { count: 'exact', head: true })
          .in('class_id', ids)

        studentsCount = count || 0

        const today = new Date().toISOString().split('T')[0]

        const { count: matches } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .in('class_id', ids)
          .gte('match_date', today)

        matchesCount = matches || 0
      }

      setStats({
        classes: classesCount || 0,
        events: eventsCount || 0,
        students: studentsCount,
        matches: matchesCount
      })
    } catch (error) {
      console.error('❌ loadStats error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Ver Turmas",
      description: "Turmas sincronizadas",
      icon: Users,
      color: "bg-blue-50 hover:bg-blue-100 text-blue-600",
      link: "/classes"
    }
  ]

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header component is now handled by Layout */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header component is now handled by Layout */}
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Olá, {user?.name}! 👋
            </h2>
            <p className="text-gray-600">
              Aqui está um resumo das suas atividades no Sistema Ignição
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8"> {/* Adjusted grid for responsiveness */}
            <StatCard icon={Users} value={stats.classes} label="Turmas Ativas" color="bg-blue-500" />
            <StatCard icon={Calendar} value={stats.events} label="Eventos Criados" color="bg-green-500" />
            <StatCard icon={BookOpen} value={stats.students} label="Alunos Total" color="bg-purple-500" />
            <StatCard icon={Activity} value={stats.matches} label="Partidas Hoje" color="bg-orange-500" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Adjusted grid for responsiveness */}
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className={`p-6 rounded-lg transition-all duration-200 text-left hover:scale-105 ${action.color}`}
                >
                  <action.icon className="w-8 h-8 mb-3" />
                  <h4 className="font-medium mb-1">{action.title}</h4>
                  <p className="text-sm opacity-80">{action.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  color
}: {
  icon: typeof Users
  value: number
  label: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  )
}
