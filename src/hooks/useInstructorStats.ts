import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { InstructorStats } from '../types/badges'

export interface SimpleBadge {
  id: string
  title: string
  achieved: boolean
  requirement: number
  current: number
}

type InstructorStatsData = Pick<InstructorStats, 'classes' | 'students' | 'matches' | 'events' | 'leaders' | 'totalProfit' | 'packagesSold' | 'engagement' | 'pioneerRank' | 'top10Classes' | 'top5Classes' | 'top3Classes'>

interface UseInstructorStatsReturn {
  stats: InstructorStatsData
  badges: SimpleBadge[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useInstructorStats(): UseInstructorStatsReturn {
  const { user, isLoading: authLoading } = useAuth()

  const [stats, setStats] = useState<InstructorStatsData>({
    classes: 0,
    students: 0,
    matches: 0,
    events: 0,
    leaders: 0,
    totalProfit: 0,
    packagesSold: 0,
    engagement: 0,
    pioneerRank: 0,
    top10Classes: 0,
    top5Classes: 0,
    top3Classes: 0
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateBadges = (stats: InstructorStatsData): SimpleBadge[] => {
    return [
      {
        id: 'classes-badge',
        title: 'Formador de Turmas',
        achieved: stats.classes >= 5,
        requirement: 5,
        current: stats.classes
      },
      {
        id: 'students-badge',
        title: 'Mentor de Alunos',
        achieved: stats.students >= 10,
        requirement: 10,
        current: stats.students
      },
      {
        id: 'matches-badge',
        title: 'Facilitador de Jogos',
        achieved: stats.matches >= 3,
        requirement: 3,
        current: stats.matches
      },
      {
        id: 'events-badge',
        title: 'Organizador de Eventos',
        achieved: stats.events >= 2,
        requirement: 2,
        current: stats.events
      }
    ]
  }

  const loadStats = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Try to get from instructor_stats table first
      const { data: statsData, error: statsError } = await supabase
        .from('instructor_stats')
        .select('classes, students, matches, events, leaders, totalProfit, packagesSold, engagement, pioneerRank, top10Classes, top5Classes, top3Classes')
        .eq('instructor_id', user.id)
        .single()

      if (statsData && !statsError) {
        setStats({
          classes: statsData.classes || 0,
          students: statsData.students || 0,
          matches: statsData.matches || 0,
          events: statsData.events || 0,
          leaders: statsData.leaders || 0,
          totalProfit: statsData.totalProfit || 0,
          packagesSold: statsData.packagesSold || 0,
          engagement: statsData.engagement || 0,
          pioneerRank: statsData.pioneerRank || 0,
          top10Classes: statsData.top10Classes || 0,
          top5Classes: statsData.top5Classes || 0,
          top3Classes: statsData.top3Classes || 0
        })
      } else {
        // Show zeros when table is empty or no data found
        setStats({
          classes: 0,
          students: 0,
          matches: 0,
          events: 0,
          leaders: 0,
          totalProfit: 0,
          packagesSold: 0,
          engagement: 0,
          pioneerRank: 0,
          top10Classes: 0,
          top5Classes: 0,
          top3Classes: 0
        })
      }
    } catch (err) {
      console.error('Error loading instructor stats:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
      
      // Show zeros on error instead of fallback calculations
      setStats({
        classes: 0,
        students: 0,
        matches: 0,
        events: 0,
        leaders: 0,
        totalProfit: 0,
        packagesSold: 0,
        engagement: 0,
        pioneerRank: 0,
        top10Classes: 0,
        top5Classes: 0,
        top3Classes: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStatsFromTables = async (): Promise<InstructorStatsData> => {
    if (!user?.id) {
      return { 
        classes: 0, students: 0, matches: 0, events: 0,
        leaders: 0, totalProfit: 0, packagesSold: 0, engagement: 0,
        pioneerRank: 0, top10Classes: 0, top5Classes: 0, top3Classes: 0
      }
    }

    const [
      classesCount, 
      studentsCount, 
      matchesCount, 
      eventsCount,
      leadersCount,
      totalProfit,
      packagesSold,
      engagement,
      pioneerRank,
      top10Classes,
      top5Classes,
      top3Classes
    ] = await Promise.all([
      getClassesCount(),
      getStudentsCount(),
      getMatchesCount(),
      getEventsCount(),
      getLeadersCount(),
      getTotalProfit(),
      getPackagesSold(),
      getEngagement(),
      getPioneerRank(),
      getTop10Classes(),
      getTop5Classes(),
      getTop3Classes()
    ])

    return {
      classes: classesCount,
      students: studentsCount,
      matches: matchesCount,
      events: eventsCount,
      leaders: leadersCount,
      totalProfit,
      packagesSold,
      engagement,
      pioneerRank,
      top10Classes,
      top5Classes,
      top3Classes
    }
  }

  const getClassesCount = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', user!.id)

    if (error) {
      console.error('Error counting classes:', error)
      return 0
    }
    return count || 0
  }

  const getStudentsCount = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        class_players (
          player_id
        )
      `)
      .eq('instructor_id', user!.id)

    if (error) {
      console.error('Error counting students:', error)
      return 0
    }

    const uniqueStudents = new Set()
    data?.forEach(classItem => {
      classItem.class_players?.forEach((cp: any) => {
        if (cp.player_id) {
          uniqueStudents.add(cp.player_id)
        }
      })
    })

    return uniqueStudents.size
  }

  const getMatchesCount = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        matches (
          id
        )
      `)
      .eq('instructor_id', user!.id)

    if (error) {
      console.error('Error counting matches:', error)
      return 0
    }

    let totalMatches = 0
    data?.forEach(classItem => {
      totalMatches += classItem.matches?.length || 0
    })

    return totalMatches
  }

  const getEventsCount = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', user!.id)

    if (error) {
      console.error('Error counting events:', error)
      return 0
    }
    return count || 0
  }

  const getLeadersCount = async (): Promise<number> => {
    // Buscar alunos das turmas do instrutor
    const { data: classIds } = await supabase
      .from('classes')
      .select('id')
      .eq('instructor_id', user!.id)

    if (!classIds?.length) return 0

    const ids = classIds.map(c => c.id)
    
    // Buscar players dessas turmas
    const { data: classPlayers, error: playersError } = await supabase
      .from('class_players')
      .select('player_id')
      .in('class_id', ids)

    if (playersError || !classPlayers?.length) {
      console.error('Error fetching class players:', playersError)
      return 0
    }

    // Extrair IDs únicos dos players
    const uniquePlayerIds = [...new Set(classPlayers.map(cp => cp.player_id).filter(Boolean))]

    if (!uniquePlayerIds.length) return 0

    // Verificar quantos desses players se tornaram instrutores
    const { data: instructors, error: instructorsError } = await supabase
      .from('instructors')
      .select('id')
      .in('id', uniquePlayerIds)

    if (instructorsError) {
      console.error('Error counting leaders (players who became instructors):', instructorsError)
      return 0
    }

    return instructors?.length || 0
  }

  const getTotalProfit = async (): Promise<number> => {
    const { data: classIds } = await supabase
      .from('classes')
      .select('id')
      .eq('instructor_id', user!.id)

    if (!classIds?.length) return 0

    const ids = classIds.map(c => c.id)
    const { data, error } = await supabase
      .from('match_results')
      .select('lucro')
      .in('class_id', ids)

    if (error) {
      console.error('Error calculating total profit:', error)
      return 0
    }

    return data?.reduce((acc, curr) => acc + (curr.lucro || 0), 0) || 0
  }

  const getPackagesSold = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', user!.id)

    if (error) {
      console.error('Error counting packages sold:', error)
      return 0
    }
    return count || 0
  }

  const getEngagement = async (): Promise<number> => {
    const { data: classIds } = await supabase
      .from('classes')
      .select('id')
      .eq('instructor_id', user!.id)

    if (!classIds?.length) return 0

    const ids = classIds.map(c => c.id)
    const { data, error } = await supabase
      .from('match_results')
      .select('satisfacao')
      .in('class_id', ids)
      .not('satisfacao', 'is', null)

    if (error) {
      console.error('Error calculating engagement (satisfaction):', error)
      return 0
    }

    if (!data?.length) return 0

    const total = data.reduce((sum, row) => sum + (row.satisfacao || 0), 0)
    return Math.round(total / data.length)
  }

  const getPioneerRank = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('instructors')
      .select('id, created_at')
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('Error calculating pioneer rank:', error)
      return 0
    }

    const rank = data?.findIndex(instructor => instructor.id === user!.id) + 1
    return rank > 0 && rank <= 100 ? rank : 0
  }

  const getClassRankingData = async () => {
    // Calcular ranking das turmas por média de lucro
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        instructor_id,
        match_results (
          lucro
        )
      `)

    if (error) {
      console.error('Error calculating class ranking:', error)
      return []
    }

    // Calcular média de lucro por turma
    const classAvgs = data?.map(classItem => {
      const results = classItem.match_results || []
      const totalProfit = results.reduce((sum: number, result: any) => sum + (result.lucro || 0), 0)
      const avgProfit = results.length > 0 ? totalProfit / results.length : 0
      
      return {
        class_id: classItem.id,
        instructor_id: classItem.instructor_id,
        avgProfit
      }
    }) || []

    // Ordenar por média de lucro (decrescente)
    classAvgs.sort((a, b) => b.avgProfit - a.avgProfit)
    return classAvgs
  }

  const getTop10Classes = async (): Promise<number> => {
    const classAvgs = await getClassRankingData()
    let count = 0
    
    classAvgs.forEach((classAvg, index) => {
      if (classAvg.instructor_id === user!.id && index < 10) {
        count++
      }
    })
    
    return count
  }

  const getTop5Classes = async (): Promise<number> => {
    const classAvgs = await getClassRankingData()
    let count = 0
    
    classAvgs.forEach((classAvg, index) => {
      if (classAvg.instructor_id === user!.id && index < 5) {
        count++
      }
    })
    
    return count
  }

  const getTop3Classes = async (): Promise<number> => {
    const classAvgs = await getClassRankingData()
    let count = 0
    
    classAvgs.forEach((classAvg, index) => {
      if (classAvg.instructor_id === user!.id && index < 3) {
        count++
      }
    })
    
    return count
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
    badges: calculateBadges(stats),
    isLoading,
    error,
    refetch: loadStats
  }
}