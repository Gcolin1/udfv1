import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Student, Team } from '../types'
import { formatCsvValue, sanitizeFilename, getPurposeLabel } from './formatters'

export function exportStudentsToCSV(
  students: Student[], 
  teams: Team[], 
  classCode: string
): void {
  if (!students || students.length === 0) {
    throw new Error('Não há alunos para exportar.')
  }

  try {
    const headers = [
      'Nome', 
      'Email', 
      'Total Partidas', 
      'Pontuação Média', 
      'Propósito', 
      'Time', 
      'Ingressou em'
    ]
    
    const csvRows = students.map(student => {
      const joinedAt = student.joined_at 
        ? format(new Date(student.joined_at), 'dd/MM/yyyy', { locale: ptBR }) 
        : ''
      
      const team = teams.find(t => t.members.some(m => m.id === student.id))
      const purposeLabel = getPurposeLabel(student.purpose)

      return [
        formatCsvValue(student.name || ''),
        formatCsvValue(student.email || ''),
        student.total_matches,
        student.avg_score,
        formatCsvValue(purposeLabel),
        formatCsvValue(team?.name || 'Sem time'),
        formatCsvValue(joinedAt)
      ].join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\n')
    downloadCSV(csvContent, `alunos_turma_${sanitizeFilename(classCode)}.csv`)
    
  } catch (error) {
    console.error('Erro ao exportar CSV:', error)
    throw new Error('Erro ao exportar lista de alunos')
  }
}

export function exportRankingToCSV(
  rankingData: any[], 
  classCode: string
): void {
  if (!rankingData || rankingData.length === 0) {
    throw new Error('Não há dados de ranking para exportar.')
  }

  try {
    const headers = [
      'Posição',
      'Nome', 
      'Tipo',
      'Score',
      'Partidas',
      'Status'
    ]
    
    const csvRows = rankingData.map(item => [
      item.position,
      formatCsvValue(item.name),
      formatCsvValue(item.isTeam ? 'Time' : 'Individual'),
      item.score,
      item.matches,
      formatCsvValue(item.statusColor || 'gray')
    ].join(','))

    const csvContent = [headers.join(','), ...csvRows].join('\n')
    downloadCSV(csvContent, `ranking_turma_${sanitizeFilename(classCode)}.csv`)
    
  } catch (error) {
    console.error('Erro ao exportar ranking CSV:', error)
    throw new Error('Erro ao exportar ranking')
  }
}

export function exportIndicatorsToCSV(
  indicators: any[], 
  classCode: string
): void {
  if (!indicators || indicators.length === 0) {
    throw new Error('Não há indicadores para exportar.')
  }

  try {
    const headers = [
      'Nome',
      'Email',
      'Lucro Total',
      'Satisfação Média',
      'Bônus Total',
      'Propósito',
      'Engajamento (%)',
      'Status',
      'Posição Lucro',
      'Posição Satisfação', 
      'Posição Bônus'
    ]
    
    const csvRows = indicators.map(indicator => [
      formatCsvValue(indicator.name || ''),
      formatCsvValue(indicator.email || ''),
      indicator.totalLucro,
      indicator.avgSatisfacao,
      indicator.totalBonus,
      formatCsvValue(getPurposeLabel(indicator.purpose)),
      indicator.individualEngagement,
      formatCsvValue(indicator.statusColor),
      indicator.lucroPosition,
      indicator.satisfacaoPosition,
      indicator.bonusPosition
    ].join(','))

    const csvContent = [headers.join(','), ...csvRows].join('\n')
    downloadCSV(csvContent, `indicadores_turma_${sanitizeFilename(classCode)}.csv`)
    
  } catch (error) {
    console.error('Erro ao exportar indicadores CSV:', error)
    throw new Error('Erro ao exportar indicadores')
  }
}

function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.href = url
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  return `${prefix}_${timestamp}.${extension}`
}

export function validateExportData(data: any[], dataType: string): void {
  if (!Array.isArray(data)) {
    throw new Error(`Dados de ${dataType} devem ser um array`)
  }
  
  if (data.length === 0) {
    throw new Error(`Não há dados de ${dataType} para exportar`)
  }
}