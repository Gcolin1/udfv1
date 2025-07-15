import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DashboardStats } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface UseDashboardStatsReturn {
  stats: DashboardStats
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    classes: 0,
    events: 0,
    students: 0,
    matches: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

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

        const { count: matches } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .in('class_id', ids)

        matchesCount = matches || 0
      }

      setStats({
        classes: classesCount || 0,
        events: eventsCount || 0,
        students: studentsCount,
        matches: matchesCount
      })
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (user?.id) {
      loadStats()
    } else {
      setIsLoading(false)
    }
  }, [authLoading, user?.id])

  return {
    stats,
    isLoading,
    error,
    refetch: loadStats
  }
}