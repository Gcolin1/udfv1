// Shared utility functions for alert calculations
// Uses the same logic as the new statusColor calculation

interface Student {
  id: string
  name: string | null
  email: string | null
  purpose: 'lucro' | 'satisfacao' | 'bonus' | null
  color: number
  team_id: string | null
}

interface MatchResult {
  player_id: string
  class_id: string
  match_number: number
  lucro: number | null
  satisfacao: number | null
  bonus: number | null
  created_at: string
}

interface Team {
  id: string
  name: string | null
  group_purpose: 'lucro' | 'satisfacao' | 'bonus' | null
  class_id: string
  members: Student[]
}

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
  
  // Calculate individual student indicators with the same logic as ClassDetailsPage
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

    // Calculate individual engagement
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

  // Calculate class averages for relative comparison
  const participatingStudents = indicators.filter(s => s.hasParticipated)
  const classAverages = {
    lucro: participatingStudents.length > 0 ? participatingStudents.reduce((sum, s) => sum + s.totalLucro, 0) / participatingStudents.length : 0,
    satisfacao: participatingStudents.length > 0 ? participatingStudents.reduce((sum, s) => sum + s.avgSatisfacao, 0) / participatingStudents.length : 0,
    bonus: participatingStudents.length > 0 ? participatingStudents.reduce((sum, s) => sum + s.totalBonus, 0) / participatingStudents.length : 0,
  }

  // Calculate status for each student using the new logic
  indicators.forEach(indicator => {
    const purpose = indicator.purpose || indicator.groupPurpose

    // If student hasn't participated, add to inactive
    if (!indicator.hasParticipated) {
      inactiveStudents.push({
        name: indicator.name || 'Sem nome'
      })
      return
    }

    // Calculate relative performance (compared to class average)
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

    // Combine performance + engagement
    const engagementWeight = 0.3 // 30% weight for engagement
    const performanceWeight = 0.7 // 70% weight for performance
    
    const combinedScore = (performancePercentage * performanceWeight) + (indicator.individualEngagement * engagementWeight)

    // Define status based on combined score
    let statusColor: 'green' | 'yellow' | 'red' = 'red'
    if (combinedScore >= 80) {
      statusColor = 'green'
    } else if (combinedScore >= 50) {
      statusColor = 'yellow'
    } else {
      statusColor = 'red'
    }

    // Add to appropriate alert category
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
    // Green students don't need alerts
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