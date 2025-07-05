// src/pages/ClassDetailsPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Crown, Medal, Trophy, Users as UsersIcon } from 'lucide-react'
import { format, startOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

import { ClassOverview } from '../components/ClassDetails/ClassOverview'
import { DetailedReport } from '../components/ClassDetails/DetailedReport'
import { ClassInfoCard } from '../components/ClassDetails/ClassInfoCard'
import { ClassScheduleCalendar } from '../components/ClassDetails/ClassScheduleCalendar'
import { ClassRankingChart } from '../components/ClassDetails/ClassRankingChart'
import { ClassStudentsList } from '../components/ClassDetails/ClassStudentsList'
import { ClassSidebar } from '../components/ClassDetails/ClassSidebar'
import { ClassCodeCard } from '../components/ClassDetails/ClassCodeCard'
import { FloatingTooltip } from '../components/common/FloatingTooltip'
import { TeamFormationModal } from '../components/ClassDetails/TeamFormationModal'

import { ClassIndicators } from '../components/ClassDetails/ClassIndicators'
import StudentGrowth from '../components/ClassDetails/ClassGrowthChart'
import { NotificationBell } from '../components/NotificationBell'

interface Class {
  id: string
  code: string
  description: string | null
  instructor_id: string | null
  influencer_id: string | null
  event_id: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  event_type: 'training' | 'course'
  schedule: Array<{ 'initial-time': string; 'end-time': string }> | null
  event?: {
    name: string
    subject: string
  }
  influencer?: {
    name: string
    email: string
  }
  instructor?: {
    name: string
    email: string
  }
}

interface Student {
  id: string
  name: string | null
  email: string | null
  joined_at: string | null
  total_matches: number
  avg_score: number
  purpose: 'lucro' | 'satisfacao' | 'bonus' | null
  team_id: string | null
}

interface RankingData {
  name: string
  score: number
  position: number
  matches: number
  isTeam?: boolean
}

interface ScheduledDateInfo {
  date: Date
  initialTime: string
  endTime: string
  description: string   
  index: number
}

interface MatchResult {
  player_id: string
  class_id: string
  match_number: number
  lucro: number | null
  satisfacao: number | null
  bonus: number | null
  created_at: string
  player?: {
    name: string | null
    email: string | null
    purpose?: 'lucro' | 'satisfacao' | 'bonus' | null
  }
}

interface Team {
  id: string
  name: string | null
  group_purpose: 'lucro' | 'satisfacao' | 'bonus' | null
  class_id: string
  members: Student[]
}

interface StudentIndicator {
  id: string
  name: string | null
  email: string | null
  totalLucro: number
  avgSatisfacao: number
  totalBonus: number
  purpose: 'lucro' | 'satisfacao' | 'bonus' | null
  groupPurpose: 'lucro' | 'satisfacao' | 'bonus' | null
  statusColor: 'green' | 'yellow' | 'red'
  lucroPosition: number
  satisfacaoPosition: number
  bonusPosition: number
  totalPosition: number
  isTeam?: boolean
}

export function ClassDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [classData, setClassData] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [rankingData, setRankingData] = useState<RankingData[]>([])
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [studentIndicators, setStudentIndicators] = useState<StudentIndicator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scheduledDatesMap, setScheduledDatesMap] = useState<Map<string, ScheduledDateInfo>>(new Map())
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [activeTab, setActiveTab] = useState<'overview' | 'ranking' | 'indicators' | 'growth' | 'detailed-report'>('overview')
  const [showTeamFormation, setShowTeamFormation] = useState(false)
  const [alertsCount, setAlertsCount] = useState(0)

  const [tooltipInfo, setTooltipInfo] = useState<ScheduledDateInfo | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (user && id) {
      loadClassData()
    }
  }, [user, id])

  useEffect(() => {
    if (students.length > 0 && matchResults.length > 0) {
      calculateRankingData()
      calculateStudentIndicators()
    }
  }, [students, matchResults, teams])

  useEffect(() => {
    // Calcular alertas baseado nos studentIndicators
    const criticalCount = studentIndicators.filter(s => s.statusColor === 'red').length
    const lowPerformanceCount = studentIndicators.filter(s => s.statusColor === 'yellow').length
    setAlertsCount(criticalCount + lowPerformanceCount)
  }, [studentIndicators])

  const handleShowTooltip = (info: ScheduledDateInfo | null, rect: DOMRect | null) => {
    if (info && rect) {
      setTooltipInfo(info)
      setTooltipPosition({
        top: rect.top,
        left: rect.left + rect.width / 2
      })
    } else {
      setTooltipInfo(null)
      setTooltipPosition(null)
    }
  }

  const loadClassData = async () => {
    if (!user || !id) return

    setIsLoading(true)

    try {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          events:event_id (name, subject, difficulty),
          influencers:influencer_id (name, email)
        `)
        .eq('id', id)
        .eq('instructor_id', user.id)
        .single()

      if (classError) {
        console.error('Error loading class data:', classError)
        setIsLoading(false)
        return
      }

      const { data: studentsData, error: studentsError } = await supabase
        .from('class_players')
        .select(`
          *,
          players:player_id (id, name, email, purpose, team_id)
        `)
        .eq('class_id', id)

      if (studentsError) {
        console.error('Error loading students:', studentsError)
      }

      const { data: matchResultsData, error: matchResultsError } = await supabase
        .from('match_results')
        .select(`
          *,
          players:player_id (name, email, purpose)
        `)
        .eq('class_id', id)

      if (matchResultsError) {
        console.error('Error loading match results:', matchResultsError)
      }

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('class_id', id)

      if (teamsError) {
        console.error('Error loading teams:', teamsError)
      }

      const formattedStudents = (studentsData || []).map(item => ({
        id: item.players?.id || '',
        name: item.players?.name || null,
        email: item.players?.email || null,
        joined_at: item.joined_at,
        total_matches: item.total_matches || 0,
        avg_score: item.avg_score || 0,
        purpose: item.players?.purpose || null,
        team_id: item.players?.team_id || null
      }))

      const formattedMatchResults = (matchResultsData || []).map(result => ({
        ...result,
        player: Array.isArray(result.players) ? result.players[0] : result.players
      }))

      const teamsWithMembers = (teamsData || []).map(team => ({
        ...team,
        members: formattedStudents.filter(student => student.team_id === team.id)
      }))

      setClassData({
        ...classData,
        event: Array.isArray(classData.events) ? classData.events[0] : classData.events,
        influencer: Array.isArray(classData.influencers) ? classData.influencers[0] : classData.influencers,
        instructor: {
          name: (user as any)?.user_metadata?.name || user.email || 'Instrutor',
          email: user.email || ''
        }
      })
      setStudents(formattedStudents)
      setMatchResults(formattedMatchResults)
      setTeams(teamsWithMembers)

      const scheduleMap = new Map<string, ScheduledDateInfo>()
      if (classData.schedule && Array.isArray(classData.schedule) && classData.schedule.length > 0) {
        type Meeting = { 'initial-time': string; 'end-time': string }
        const validMeetings = classData.schedule.filter((meeting: Meeting) => {
          return meeting &&
            meeting['initial-time'] &&
            typeof meeting['initial-time'] === 'string' &&
            meeting['initial-time'].trim() !== '' &&
            meeting['end-time'] &&
            typeof meeting['end-time'] === 'string' &&
            meeting['end-time'].trim() !== ''
        })

        const sortedMeetings = validMeetings.sort((a: Meeting, b: Meeting) => {
          const dateA = parseISO(a['initial-time'])
          const dateB = parseISO(b['initial-time'])
          return dateA.getTime() - dateB.getTime()
        })

        sortedMeetings.forEach((meeting: Meeting, index: number) => {
          try {
            const initialTime = parseISO(meeting['initial-time'])
            const endTime = parseISO(meeting['end-time'])

            let description = ''
            if (index === 0) {
              description = 'Primeiro encontro'
            } else if (index === sortedMeetings.length - 1) {
              description = 'Último encontro'
            } else {
              description = `${index + 1}º encontro`
            }
            scheduleMap.set(format(initialTime, 'yyyy-MM-dd'), {
              date: initialTime,
              initialTime: format(initialTime, 'HH:mm', { locale: ptBR }),
              endTime: format(endTime, 'HH:mm', { locale: ptBR }),
              description: description,
              index: index + 1
            })
          } catch (parseError) {
            console.warn('Error parsing schedule date for meeting:', meeting, parseError)
          }
        })

        if (sortedMeetings.length > 0) {
          try {
            const firstMeetingDate = parseISO(sortedMeetings[0]['initial-time'])
            setCurrentMonth(startOfMonth(firstMeetingDate))
          } catch (parseError) {
            console.warn('Error parsing first meeting date:', parseError)
          }
        }
      }
      setScheduledDatesMap(scheduleMap)

    } catch (error) {
      console.error('Error loading class data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateRankingData = () => {
    if (students.length === 0 || matchResults.length === 0) return

    const hasTeams = teams.length > 0 && teams.some(team => team.members.length > 0)

    if (hasTeams) {
      const teamStats = teams
        .filter(team => team.members.length > 0)
        .map(team => {
          const teamResults = matchResults.filter(result =>
            team.members.some(member => member.id === result.player_id)
          )

          const totalLucro = teamResults.reduce((sum, result) => sum + (result.lucro || 0), 0)

          const satisfacaoResults = matchResults.filter(result =>
            team.members.some(member => member.id === result.player_id) && result.satisfacao !== null
          );
          const totalSatisfacao = satisfacaoResults.reduce((sum, result) => sum + (result.satisfacao || 0), 0)
          const avgSatisfacao = satisfacaoResults.length > 0 ? totalSatisfacao / satisfacaoResults.length : 0

          const totalBonus = teamResults.reduce((sum, result) => sum + (result.bonus || 0), 0)

          return {
            id: team.id,
            name: team.name || 'Time sem nome',
            totalLucro,
            avgSatisfacao,
            totalBonus,
            matches: team.members.reduce((sum, member) => sum + matchResults.filter(r => r.player_id === member.id).length, 0),
            isTeam: true
          }
        })

      const individualStats = students
        .filter(student => !student.team_id)
        .map(student => {
          const studentResults = matchResults.filter(result => result.player_id === student.id)

          const totalLucro = studentResults.reduce((sum, result) => sum + (result.lucro || 0), 0)

          const satisfacaoResults = studentResults.filter(result => result.satisfacao !== null)
          const totalSatisfacao = satisfacaoResults.reduce((sum, result) => sum + (result.satisfacao || 0), 0)
          const avgSatisfacao = satisfacaoResults.length > 0 ? totalSatisfacao / satisfacaoResults.length : 0

          const totalBonus = studentResults.reduce((sum, result) => sum + (result.bonus || 0), 0)

          return {
            id: student.id,
            name: student.name || 'Sem nome',
            totalLucro,
            avgSatisfacao,
            totalBonus,
            matches: studentResults.length,
            isTeam: false
          }
        })

      const allEntities = [...teamStats, ...individualStats]

      const lucroRanking = [...allEntities].sort((a, b) => b.totalLucro - a.totalLucro)
      const satisfacaoRanking = [...allEntities].sort((a, b) => b.avgSatisfacao - a.avgSatisfacao)
      const bonusRanking = [...allEntities].sort((a, b) => b.totalBonus - a.totalBonus)

      const finalRanking = allEntities.map(entity => {
        const lucroPos = lucroRanking.findIndex(e => e.id === entity.id) + 1
        const satisfacaoPos = satisfacaoRanking.findIndex(e => e.id === entity.id) + 1
        const bonusPos = bonusRanking.findIndex(e => e.id === entity.id) + 1

        const totalPosition = lucroPos + satisfacaoPos + bonusPos

        return {
          ...entity,
          lucroPosition: lucroPos,
          satisfacaoPosition: satisfacaoPos,
          bonusPosition: bonusPos,
          totalPosition,
          score: totalPosition
        }
      })

      finalRanking.sort((a, b) => {
        if (a.totalPosition !== b.totalPosition) {
          return a.totalPosition - b.totalPosition
        }
        if (a.totalLucro !== b.totalLucro) {
          return b.totalLucro - a.totalLucro
        }
        if (a.avgSatisfacao !== b.avgSatisfacao) {
          return b.avgSatisfacao - a.avgSatisfacao
        }
        return b.totalBonus - a.totalBonus
      })

      const rankingWithPosition = finalRanking.map((entity, index) => ({
        name: entity.name,
        score: entity.totalPosition,
        position: index + 1,
        matches: entity.matches,
        isTeam: entity.isTeam
      }))

      setRankingData(rankingWithPosition)
    } else {
      const studentStats = students.map(student => {
        const studentResults = matchResults.filter(result => result.player_id === student.id)

        const totalLucro = studentResults.reduce((sum, result) => sum + (result.lucro || 0), 0)

        const satisfacaoResults = studentResults.filter(result => result.satisfacao !== null)
        const totalSatisfacao = satisfacaoResults.reduce((sum, result) => sum + (result.satisfacao || 0), 0)
        const avgSatisfacao = satisfacaoResults.length > 0 ? totalSatisfacao / satisfacaoResults.length : 0

        const totalBonus = studentResults.reduce((sum, result) => sum + (result.bonus || 0), 0)

        return {
          id: student.id,
          name: student.name || 'Sem nome',
          totalLucro,
          avgSatisfacao,
          totalBonus,
          matches: studentResults.length
        }
      })

      const lucroRanking = [...studentStats].sort((a, b) => b.totalLucro - a.totalLucro)
      const satisfacaoRanking = [...studentStats].sort((a, b) => b.avgSatisfacao - a.avgSatisfacao)
      const bonusRanking = [...studentStats].sort((a, b) => b.totalBonus - a.totalBonus)

      const finalRanking = studentStats.map(student => {
        const lucroPos = lucroRanking.findIndex(s => s.id === student.id) + 1
        const satisfacaoPos = satisfacaoRanking.findIndex(s => s.id === student.id) + 1
        const bonusPos = bonusRanking.findIndex(s => s.id === student.id) + 1

        const totalPosition = lucroPos + satisfacaoPos + bonusPos

        return {
          ...student,
          lucroPosition: lucroPos,
          satisfacaoPosition: satisfacaoPos,
          bonusPosition: bonusPos,
          totalPosition,
          score: totalPosition
        }
      })

      finalRanking.sort((a, b) => {
        if (a.totalPosition !== b.totalPosition) {
          return a.totalPosition - b.totalPosition
        }
        if (a.totalLucro !== b.totalLucro) {
          return b.totalLucro - a.totalLucro
        }
        if (a.avgSatisfacao !== b.avgSatisfacao) {
          return b.avgSatisfacao - a.avgSatisfacao
        }
        return b.totalBonus - a.totalBonus
      })

      const rankingWithPosition = finalRanking.map((student, index) => ({
        name: student.name,
        score: student.totalPosition,
        position: index + 1,
        matches: student.matches,
        isTeam: false
      }))

      setRankingData(rankingWithPosition)
    }
  }

  const calculateStudentIndicators = () => {
    if (students.length === 0 || matchResults.length === 0) return

    const indicators = students.map(student => {
      const studentResults = matchResults.filter(result => result.player_id === student.id)

      const totalLucro = studentResults.reduce((sum, result) => sum + (result.lucro || 0), 0)

      const satisfacaoResults = studentResults.filter(result => result.satisfacao !== null)
      const totalSatisfacao = satisfacaoResults.reduce((sum, result) => sum + (result.satisfacao || 0), 0)
      const avgSatisfacao = satisfacaoResults.length > 0 ? totalSatisfacao / satisfacaoResults.length : 0

      const totalBonus = studentResults.reduce((sum, result) => sum + (result.bonus || 0), 0)

      const studentTeam = teams.find(team =>
        team.members.some(member => member.id === student.id)
      )

      let statusColor: 'green' | 'yellow' | 'red' = 'yellow'
      const purpose = student.purpose || studentTeam?.group_purpose

      if (purpose) {
        let targetValue = 0
        switch (purpose) {
          case 'lucro':
            targetValue = totalLucro
            break
          case 'satisfacao':
            targetValue = avgSatisfacao
            break
          case 'bonus':
            targetValue = totalBonus
            break
        }

        if (targetValue >= 80) statusColor = 'green'
        else if (targetValue >= 50) statusColor = 'yellow'
        else statusColor = 'red'
      }

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        totalLucro,
        avgSatisfacao: Math.round(avgSatisfacao),
        totalBonus,
        purpose: student.purpose,
        groupPurpose: studentTeam?.group_purpose || null,
        statusColor,
        lucroPosition: 0,
        satisfacaoPosition: 0,
        bonusPosition: 0,
        totalPosition: 0,
        isTeam: !!student.team_id
      }
    })

    const lucroSorted = [...indicators].sort((a, b) => b.totalLucro - a.totalLucro)
    const satisfacaoSorted = [...indicators].sort((a, b) => b.avgSatisfacao - a.avgSatisfacao)
    const bonusSorted = [...indicators].sort((a, b) => b.totalBonus - a.totalBonus)

    indicators.forEach(indicator => {
      indicator.lucroPosition = lucroSorted.findIndex(s => s.id === indicator.id) + 1
      indicator.satisfacaoPosition = satisfacaoSorted.findIndex(s => s.id === indicator.id) + 1
      indicator.bonusPosition = bonusSorted.findIndex(s => s.id === indicator.id) + 1
      indicator.totalPosition = indicator.lucroPosition + indicator.satisfacaoPosition + indicator.bonusPosition
    })

    setStudentIndicators(indicators)
  }

  const copyClassCode = () => {
    if (classData?.code) {
      navigator.clipboard.writeText(classData.code)
      toast.success('Código da turma copiado para a área de transferência!')
    }
  }

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'training': return 'Treinamento'
      case 'course': return 'Curso'
      default: return eventType
    }
  }

  const getStatusColor = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 'bg-gray-100 text-gray-800'

    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) return 'bg-blue-100 text-blue-800'
    if (now > end) return 'bg-red-100 text-red-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusLabel = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 'Indefinido'

    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) return 'Agendada'
    if (now > end) return 'Finalizada'
    return 'Ativa'
  }

  const exportStudentsToCsv = () => {
  if (!students || students.length === 0) {
    toast.error('Não há alunos para exportar.')
    return
  }

  try {
    const headers = ['Nome', 'Email', 'Total Partidas', 'Pontuação Média', 'Propósito', 'Time', 'Ingressou em']
    const csvRows = students.map(student => {
      const joinedAt = student.joined_at ? format(new Date(student.joined_at), 'dd/MM/yyyy', { locale: ptBR }) : ''
      const team = teams.find(t => t.members.some(m => m.id === student.id))
      const purposeLabel = student.purpose === 'lucro' ? 'Lucro' :
        student.purpose === 'satisfacao' ? 'Satisfação' :
          student.purpose === 'bonus' ? 'Bônus' : 'Não definido'

      return [
        `"${student.name || ''}"`,
        `"${student.email || ''}"`,
        student.total_matches,
        student.avg_score,
        `"${purposeLabel}"`,
        `"${team?.name || 'Sem time'}"`,
        `"${joinedAt}"`
      ].join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.href = url
    link.setAttribute('download', `alunos_turma_${classData?.code || 'export'}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
    toast.success('Lista de alunos exportada com sucesso!')
  } catch (error) {
    console.error('Erro ao exportar CSV:', error)
    toast.error('Erro ao exportar lista de alunos')
  }
}

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />
      case 2: return <Medal className="w-5 h-5 text-gray-400" />
      case 3: return <Medal className="w-5 h-5 text-orange-600" />
      default: return <Trophy className="w-4 h-4 text-blue-600" />
    }
  }

const stats = useMemo(() => {
  if (students.length === 0) {
    return {
      avgLucro: 0, avgSatisfacao: 0, avgBonus: 0, engajamento: 0,
      totalMatches: 0, avgMatches: 0, totalResults: 0, avgTotal: 0
    }
  }

  const totalLucro = matchResults.reduce((sum, result) => sum + (result.lucro || 0), 0)
  const totalSatisfacao = matchResults.reduce((sum, result) => sum + (result.satisfacao || 0), 0)
  const totalBonus = matchResults.reduce((sum, result) => sum + (result.bonus || 0), 0)
  
  const totalParticipations = matchResults.length;

  const avgLucro = totalParticipations > 0 ? totalLucro / totalParticipations : 0
  const avgSatisfacao = totalParticipations > 0 ? totalSatisfacao / totalParticipations : 0
  const avgBonus = totalParticipations > 0 ? totalBonus / totalParticipations : 0
  const avgTotal = avgLucro + avgSatisfacao + avgBonus

  const uniqueMatchNumbers = [...new Set(matchResults.map(r => r.match_number))]
  const totalUniqueMatches = uniqueMatchNumbers.length
  
  const avgMatches = students.length > 0 ? totalParticipations / students.length : 0

  const engajamento = students.length > 0 && totalUniqueMatches > 0
    ? Math.min(100, Math.round((totalParticipations / (students.length * totalUniqueMatches)) * 100))
    : 0

  return {
    avgLucro: Math.round(avgLucro),
    avgSatisfacao: Math.round(avgSatisfacao),
    avgBonus: Math.round(avgBonus),
    engajamento,
    totalMatches: totalUniqueMatches,
    avgMatches: parseFloat(avgMatches.toFixed(1)),
    totalResults: totalParticipations,
    avgTotal: Math.round(avgTotal)
  }
}, [students, matchResults]);


  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando detalhes da turma...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Turma não encontrada ou você não tem permissão para acessá-la.</p>
          <button
            onClick={() => navigate('/classes')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para Turmas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/classes')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{classData.code}</h1>
            <p className="text-gray-600 mt-1">{classData.description}</p>
          </div>
        </div>

        {/* Botão de Formar Times e Sino de Notificações */}
        <div className="flex items-center gap-3">
          <NotificationBell alertsCount={alertsCount} classId={id} />
          <button
            onClick={() => setShowTeamFormation(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
          >
            <UsersIcon className="w-5 h-5" />
            Gerenciar Turma
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-6 text-lg font-medium whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`py-3 px-6 text-lg font-medium whitespace-nowrap ${
                activeTab === 'ranking'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Ranking
            </button>
            <button
              onClick={() => setActiveTab('indicators')}
              className={`py-3 px-6 text-lg font-medium whitespace-nowrap ${
                activeTab === 'indicators'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Indicadores
            </button>
            <button
              onClick={() => setActiveTab('growth')}
              className={`py-3 px-6 text-lg font-medium whitespace-nowrap ${
                activeTab === 'growth'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Crescimento
            </button>

            <button
                onClick={() => setActiveTab('detailed-report')}
                className={`py-3 px-6 text-lg font-medium whitespace-nowrap ${
                  activeTab === 'detailed-report'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Relatório Detalhado
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
            <ClassOverview studentIndicators={studentIndicators} stats={stats} />

              <ClassInfoCard
                classData={classData}
                getEventTypeLabel={getEventTypeLabel}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />

              <ClassStudentsList students={students} matchResults={matchResults} />
            </>
          )}

          {activeTab === 'ranking' && (
            <>
              {rankingData.length > 0 ? (
                <ClassRankingChart
                  rankingData={rankingData}
                  getRankIcon={getRankIcon}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <p className="text-gray-600">Não há dados de ranking disponíveis para esta turma ainda.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'indicators' && (
            <ClassIndicators
              studentIndicators={studentIndicators}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'growth' && (
            <StudentGrowth 
              students={students}
              matchResults={matchResults}
            />
          )}

          {activeTab === 'detailed-report' && classData && (
            <DetailedReport
              classData={classData}
              students={students}
              matchResults={matchResults}
              teams={teams}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {classData.schedule && Array.isArray(classData.schedule) && classData.schedule.length > 0 && (
            <ClassScheduleCalendar
              scheduledDatesMap={scheduledDatesMap}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              onShowTooltip={handleShowTooltip}
            />
          )}

          <ClassCodeCard
            classData={classData}
            copyClassCode={copyClassCode}
          />

          <ClassSidebar
            exportStudentsToCsv={exportStudentsToCsv}
            onViewDetailedReport={() => setActiveTab('detailed-report')}
          />
        </div>
      </div>

      {/* Team Formation Modal */}
      {classData && (
        <TeamFormationModal
            isOpen={showTeamFormation}
            onClose={() => setShowTeamFormation(false)}
            classId={id!}
            onTeamsUpdated={loadClassData}
        />
      )}

      {/* Floating Tooltip */}
      <FloatingTooltip
        isVisible={!!tooltipInfo}
        position={tooltipPosition}
        content={
          tooltipInfo && (
            <div>
              <div className="font-semibold">{tooltipInfo.description}</div>
              <div className="mt-1">{tooltipInfo.initialTime} - {tooltipInfo.endTime}</div>
              <div className="text-gray-300 text-xs mt-1">
                {format(tooltipInfo.date, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>
          )
        }
      />
    </div>
  )
}