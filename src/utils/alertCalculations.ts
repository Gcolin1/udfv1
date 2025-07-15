import { Student, MatchResult, Team } from '../types'

interface AlertStudent {
  name: string
  purpose: string
  value: number
  statusColor: 'green' | 'yellow' | 'red'
}

interface AlertCounts {
  criticalCount: number
  lowPerformanceCount: number
  inactiveCount: number
  criticalStudents: AlertStudent[]
  lowPerformanceStudents: AlertStudent[]
  inactiveStudents: { name: string }[]
}

export function calculateStudentAlerts(
  students: Student[], 
  matchResults: MatchResult[], 
  teams: Team[]
): AlertCounts {
  const criticalStudents: AlertStudent[] = []
  const lowPerformanceStudents: AlertStudent[] = []
  const inactiveStudents: { name: string }[] = []
  
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

    const totalUniqueMatches = [...new Set(matchResults.map(r => r.match_number))].length
    const individualEngagement = totalUniqueMatches > 0 
      ? Math.min(100, Math.round((studentResults.length / totalUniqueMatches) * 100))
      : 0

    return {
      id: student.id,
      name: student.name,
      totalLucro,
      avgSatisfacao: Math.round(avgSatisfacao),
      totalBonus,
      purpose: student.purpose,
      groupPurpose: studentTeam?.group_purpose || null,
      hasParticipated: studentResults.length > 0,
      individualEngagement
    }
  })

  const participatingStudents = indicators.filter(s => s.hasParticipated)
  const classAverages = {
    lucro: participatingStudents.length > 0 ? participatingStudents.reduce((sum, s) => sum + s.totalLucro, 0) / participatingStudents.length : 0,
    satisfacao: participatingStudents.length > 0 ? participatingStudents.reduce((sum, s) => sum + s.avgSatisfacao, 0) / participatingStudents.length : 0,
    bonus: participatingStudents.length > 0 ? participatingStudents.reduce((sum, s) => sum + s.totalBonus, 0) / participatingStudents.length : 0,
  }

  indicators.forEach(indicator => {
    const purpose = indicator.purpose || indicator.groupPurpose

    if (!indicator.hasParticipated) {
      inactiveStudents.push({
        name: indicator.name || 'Sem nome'
      })
      return
    }

    let performancePercentage = 0
    if (purpose && classAverages[purpose] > 0) {
      let currentValue = 0
      switch (purpose) {
        case 'lucro':
          currentValue = indicator.totalLucro
          break
        case 'satisfacao':
          currentValue = indicator.avgSatisfacao
          break
        case 'bonus':
          currentValue = indicator.totalBonus
          break
      }
      performancePercentage = (currentValue / classAverages[purpose]) * 100
    }

    const engagementWeight = 0.3
    const performanceWeight = 0.7
    
    const combinedScore = (performancePercentage * performanceWeight) + (indicator.individualEngagement * engagementWeight)

    let statusColor: 'green' | 'yellow' | 'red' = 'red'
    if (combinedScore >= 80) {
      statusColor = 'green'
    } else if (combinedScore >= 50) {
      statusColor = 'yellow'
    } else {
      statusColor = 'red'
    }

    const alertStudent: AlertStudent = {
      name: indicator.name || 'Sem nome',
      purpose: purpose || 'não definido',
      value: Math.round(combinedScore),
      statusColor
    }

    if (statusColor === 'red') {
      criticalStudents.push(alertStudent)
    } else if (statusColor === 'yellow') {
      lowPerformanceStudents.push(alertStudent)
    }
  })

  return {
    criticalCount: criticalStudents.length,
    lowPerformanceCount: lowPerformanceStudents.length,
    inactiveCount: inactiveStudents.length,
    criticalStudents,
    lowPerformanceStudents,
    inactiveStudents
  }
}

export function getTotalAlertsCount(alertCounts: AlertCounts): number {
  return alertCounts.criticalCount + alertCounts.lowPerformanceCount + alertCounts.inactiveCount
}