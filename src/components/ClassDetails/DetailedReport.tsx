// src/components/ClassDetails/DetailedReport.tsx
import { useState, useMemo } from 'react'
import {
  FileText,
  Download,
  Users,
  Trophy,
  TrendingUp,
  Target,
  Calendar,
  Clock,
  Award,
  BarChart3,
  Filter,
  Search,
  Crown,
  Medal
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

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
  }
}

interface Team {
  id: string
  name: string | null
  group_purpose: 'lucro' | 'satisfacao' | 'bonus' | null
  class_id: string
  members: Student[]
}

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
    expected_matches?: number
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

interface DetailedReportProps {
  classData: Class
  students: Student[]
  matchResults: MatchResult[]
  teams: Team[]
}

interface StudentReport {
  id: string
  name: string | null
  email: string | null
  joined_at: string | null
  total_matches: number
  avg_score: number
  purpose: 'lucro' | 'satisfacao' | 'bonus' | null
  team_id: string | null
  teamName: string | null
  teamPurpose: 'lucro' | 'satisfacao' | 'bonus' | null
  totalLucro: number
  avgSatisfacao: number
  totalBonus: number
  totalScore: number
  lucroPosition: number
  satisfacaoPosition: number
  bonusPosition: number
  overallPosition: number
  matchHistory: Array<{
    match_number: number
    lucro: number | null
    satisfacao: number | null
    bonus: number | null
    created_at: string
  }>
  performance: {
    bestMatchScore: number
    worstMatchScore: number
    totalMatchesPlayed: number
    avgMatchScore: number
  }
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(value)
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function DetailedReport({ classData, students, matchResults, teams }: DetailedReportProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'team' | 'individual'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'lucro' | 'satisfacao' | 'bonus' | 'overall'>('overall')
  const [showMatchHistory] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<'summary' | 'students' | 'teams' | 'performance'>('summary')

  const getPurposeLabel = (purpose: 'lucro' | 'satisfacao' | 'bonus' | null) => {
    switch (purpose) {
      case 'lucro': return 'Lucro'
      case 'satisfacao': return 'Satisfação'
      case 'bonus': return 'Bônus'
      default: return 'Não definido'
    }
  }

  const getPurposeColor = (purpose: 'lucro' | 'satisfacao' | 'bonus' | null) => {
    switch (purpose) {
      case 'lucro': return 'bg-blue-100 text-blue-800'
      case 'satisfacao': return 'bg-green-100 text-green-800'
      case 'bonus': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />
      case 2: return <Medal className="w-5 h-5 text-gray-400" />
      case 3: return <Medal className="w-5 h-5 text-orange-600" />
      default: return <Trophy className="w-4 h-4 text-blue-600" />
    }
  }

  const processedStudents = useMemo(() => {
    const studentToTeamMap = new Map<string, Team>();
    teams.forEach(team => {
      team.members.forEach(member => {
        studentToTeamMap.set(member.id, team);
      });
    });

    const studentReports: StudentReport[] = students.map(student => {
      const studentResults = matchResults.filter(result => result.player_id === student.id)
      const team = studentToTeamMap.get(student.id);

      const totalLucro = studentResults.reduce((sum, result) => sum + (result.lucro || 0), 0)
      const satisfacaoResults = studentResults.filter(result => result.satisfacao !== null)
      const totalSatisfacao = satisfacaoResults.reduce((sum, result) => sum + (result.satisfacao || 0), 0)
      const avgSatisfacao = satisfacaoResults.length > 0 ? totalSatisfacao / satisfacaoResults.length : 0
      const totalBonus = studentResults.reduce((sum, result) => sum + (result.bonus || 0), 0)
      const totalScore = totalLucro + avgSatisfacao + totalBonus

      const matchScores = studentResults.map(r => (r.lucro || 0) + (r.satisfacao || 0) + (r.bonus || 0));
      const bestMatchScore = matchScores.length > 0 ? Math.max(...matchScores) : 0;
      const worstMatchScore = matchScores.length > 0 ? Math.min(...matchScores) : 0;
      const avgMatchScore = matchScores.length > 0 ? matchScores.reduce((a, b) => a + b, 0) / matchScores.length : 0;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        joined_at: student.joined_at,
        total_matches: student.total_matches,
        avg_score: student.avg_score,
        purpose: student.purpose,
        team_id: student.team_id,
        teamName: team?.name || null,
        teamPurpose: team?.group_purpose || null,
        totalLucro,
        avgSatisfacao: Math.round(avgSatisfacao),
        totalBonus,
        totalScore: Math.round(totalScore),
        lucroPosition: 0,
        satisfacaoPosition: 0,
        bonusPosition: 0,
        overallPosition: 0,
        matchHistory: studentResults.sort((a, b) => a.match_number - b.match_number),
        performance: {
          bestMatchScore,
          worstMatchScore,
          totalMatchesPlayed: studentResults.length,
          avgMatchScore: Math.round(avgMatchScore)
        }
      }
    })

    const sortedByLucro = [...studentReports].sort((a, b) => b.totalLucro - a.totalLucro)
    const sortedBySatisfacao = [...studentReports].sort((a, b) => b.avgSatisfacao - a.avgSatisfacao)
    const sortedByBonus = [...studentReports].sort((a, b) => b.totalBonus - a.totalBonus)
    const sortedByOverall = [...studentReports].sort((a, b) => b.totalScore - a.totalScore)

    return studentReports.map(student => {
      const lucroPos = sortedByLucro.findIndex(s => s.id === student.id) + 1
      const satisfacaoPos = sortedBySatisfacao.findIndex(s => s.id === student.id) + 1
      const bonusPos = sortedByBonus.findIndex(s => s.id === student.id) + 1
      const overallPos = sortedByOverall.findIndex(s => s.id === student.id) + 1

      return {
        ...student,
        lucroPosition: lucroPos,
        satisfacaoPosition: satisfacaoPos,
        bonusPosition: bonusPos,
        overallPosition: overallPos
      }
    })
  }, [students, matchResults, teams])

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = processedStudents.filter(student =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (filterBy === 'team') {
      filtered = filtered.filter(student => student.team_id !== null)
    } else if (filterBy === 'individual') {
      filtered = filtered.filter(student => student.team_id === null)
    }

    filtered.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortBy === 'lucro') return b.totalLucro - a.totalLucro
      if (sortBy === 'satisfacao') return b.avgSatisfacao - a.avgSatisfacao
      if (sortBy === 'bonus') return b.totalBonus - a.totalBonus
      if (sortBy === 'overall') return a.overallPosition - b.overallPosition
      return 0
    })

    return filtered
  }, [processedStudents, searchTerm, filterBy, sortBy])

  const classStats = useMemo(() => {
    const totalLucro = processedStudents.reduce((sum, s) => sum + s.totalLucro, 0)
    const totalBonus = processedStudents.reduce((sum, s) => sum + s.totalBonus, 0)
    const totalMatchesPlayed = matchResults.length
    const uniquePlayers = students.length
    const totalTeams = teams.length

    // Use o mesmo método do ClassOverview para satisfação média
    const totalSatisfacaoFromResults = matchResults.reduce((sum, result) => sum + (result.satisfacao || 0), 0)
    const avgSatisfacaoFromResults = totalMatchesPlayed > 0 ? totalSatisfacaoFromResults / totalMatchesPlayed : 0

    const totalParticipations = matchResults.length;
    const uniqueMatchNumbers = [...new Set(matchResults.map(r => r.match_number))];
    const totalUniqueMatches = uniqueMatchNumbers.length;
    
    const expectedTotalMatches = students.length * totalUniqueMatches;
    
    const classEngagement = expectedTotalMatches > 0
      ? Math.min(100, Math.round((totalParticipations / expectedTotalMatches) * 100))
      : 0;

    return {
      totalLucro: Math.round(totalLucro),
      avgLucro: uniquePlayers > 0 ? Math.round(totalLucro / uniquePlayers) : 0,
      totalSatisfacao: Math.round(totalSatisfacaoFromResults),
      avgSatisfacao: Math.round(avgSatisfacaoFromResults),
      totalBonus: Math.round(totalBonus),
      avgBonus: uniquePlayers > 0 ? Math.round(totalBonus / uniquePlayers) : 0,
      totalMatchesPlayed,
      uniquePlayers,
      totalTeams,
      avgMatchesPerPlayer: uniquePlayers > 0 ? Math.round(totalMatchesPlayed / uniquePlayers) : 0,
      classEngagement,
    }
  }, [processedStudents, matchResults, students, teams, classData.event?.expected_matches])

  const exportReport = () => {
    const summarySection = `Relatório Detalhado da Turma: ${classData.code}
Descrição: ${classData.description || 'N/A'}
Evento: ${classData.event?.name || 'N/A'} (${classData.event?.subject || 'N/A'})
Status: ${getStatusLabel(classData.start_date, classData.end_date)}
Data de Início: ${classData.start_date ? format(new Date(classData.start_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
Data de Fim: ${classData.end_date ? format(new Date(classData.end_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}

Estatísticas Gerais da Turma:
Total de Alunos: ${classStats.uniquePlayers}
Total de Times: ${classStats.totalTeams}
Total de Partidas Jogadas: ${classStats.totalMatchesPlayed}
Média de Lucro por Aluno: ${formatCurrency(classStats.avgLucro)}
Média de Satisfação por Aluno: ${classStats.avgSatisfacao}%
Média de Bônus por Aluno: ${formatCurrency(classStats.avgBonus)}
Engajamento da Turma: ${classStats.classEngagement}%
`;

    const studentHeaders = [
        'Nome', 'Email', 'Time', 'Propósito Individual', 'Propósito do Time',
        'Lucro Total', 'Satisfação Média', 'Bônus Total', 'Pontuação Total',
        'Posição Geral', 'Partidas Jogadas', 'Melhor Pontuação', 'Pior Pontuação', 'Média Pontuação por Partida',
        'Ingressou Em'
    ];
    const studentRows = processedStudents.map(s => [
        `"${s.name || ''}"`,
        `"${s.email || ''}"`,
        `"${s.teamName || 'N/A'}"`,
        `"${getPurposeLabel(s.purpose)}"`,
        `"${getPurposeLabel(s.teamPurpose)}"`,
        s.totalLucro,
        s.avgSatisfacao,
        s.totalBonus,
        s.totalScore,
        s.overallPosition,
        s.performance.totalMatchesPlayed,
        s.performance.bestMatchScore,
        s.performance.worstMatchScore,
        s.performance.avgMatchScore,
        s.joined_at ? format(new Date(s.joined_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'
    ].join(',')).join('\n');
    const studentsSection = `\nAlunos Detalhados:\n${studentHeaders.join(',')}\n${studentRows}`;

    const teamHeaders = ['Nome do Time', 'Propósito do Time', 'Membros'];
    const teamRows = teams.map(team => {
        const members = team.members.map(m => m.name).join('; ');
        return [`"${team.name || ''}"`, `"${getPurposeLabel(team.group_purpose)}"`, `"${members}"`].join(',');
    }).join('\n');
    const teamsSection = `\nTimes:\n${teamHeaders.join(',')}\n${teamRows}`;

    const matchHeaders = ['Aluno', 'Partida Número', 'Lucro', 'Satisfação', 'Bônus', 'Data'];
    const matchRows = matchResults.slice(0, 100).map(mr => [
        `"${mr.player?.name || 'N/A'}"`,
        mr.match_number,
        mr.lucro || 0,
        mr.satisfacao || 0,
        mr.bonus || 0,
        format(new Date(mr.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    ].join(',')).join('\n');
    const matchesSection = `\nResultados de Partidas (Últimas 100):\n${matchHeaders.join(',')}\n${matchRows}`;

    const csvContent = `${summarySection}\n${studentsSection}\n${teamsSection}\n${matchesSection}`;

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `relatorio_detalhado_${classData.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success('Relatório exportado com sucesso!');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Relatório Detalhado da Turma
        </h2>
        <button
          onClick={exportReport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSection('summary')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${selectedSection === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Resumo
        </button>
        <button
          onClick={() => setSelectedSection('students')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${selectedSection === 'students' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Alunos
        </button>
        <button
          onClick={() => setSelectedSection('teams')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${selectedSection === 'teams' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Times
        </button>
        <button
          onClick={() => setSelectedSection('performance')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${selectedSection === 'performance' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Performance
        </button>
      </div>

      {selectedSection === 'summary' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Visão Geral da Turma
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Detalhes da Turma</h4>
              <p className="text-sm text-gray-600"><strong>Código da Turma:</strong> {classData.code}</p>
              <p className="text-sm text-gray-600"><strong>Descrição:</strong> {classData.description || 'N/A'}</p>
              <p className="text-sm text-gray-600"><strong>Evento:</strong> {classData.event?.name || 'N/A'} ({classData.event?.subject || 'N/A'})</p>
              <p className="text-sm text-gray-600"><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(classData.start_date, classData.end_date)}`}>{getStatusLabel(classData.start_date, classData.end_date)}</span></p>
              <p className="text-sm text-gray-600"><strong>Data de Início:</strong> {classData.start_date ? format(new Date(classData.start_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}</p>
              <p className="text-sm text-gray-600"><strong>Data de Fim:</strong> {classData.end_date ? format(new Date(classData.end_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Responsáveis e Criação</h4>
              <p className="text-sm text-gray-600"><strong>Instrutor:</strong> {classData.instructor?.name || 'N/A'}</p>
              <p className="text-sm text-gray-600"><strong>Influenciador:</strong> {classData.influencer?.name || 'N/A'}</p>
              <p className="text-sm text-gray-600"><strong>Criada em:</strong> {format(new Date(classData.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            </div>
          </div>
      
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mt-6">
            <BarChart3 className="w-4 h-4" /> Estatísticas Gerais
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{classStats.uniquePlayers}</p>
              <p className="text-sm text-gray-600">Alunos</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{classStats.totalTeams}</p>
              <p className="text-sm text-gray-600">Times Formados</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{classStats.totalMatchesPlayed}</p>
              <p className="text-sm text-gray-600">Partidas Jogadas</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Calendar className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{classStats.classEngagement}%</p>
              <p className="text-sm text-gray-600">Engajamento</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xl lg:text-2xl font-bold text-gray-800 break-words">{formatCurrency(classStats.avgLucro)}</p>
              <p className="text-sm text-gray-600">Lucro Médio</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{classStats.avgSatisfacao}%</p>
              <p className="text-sm text-gray-600">Satisfação Média</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-xl lg:text-2xl font-bold text-gray-800 break-words">{formatCurrency(classStats.avgBonus)}</p>
              <p className="text-sm text-gray-600">Bônus Médio</p>
            </div>
          </div>
        </div>
      )}

      {selectedSection === 'students' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" /> Alunos ({filteredAndSortedStudents.length})
          </h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar aluno por nome, email ou time..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'team' | 'individual')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="team">Com Time</option>
                <option value="individual">Sem Time</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'lucro' | 'satisfacao' | 'bonus' | 'overall')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overall">Posição Geral</option>
                <option value="name">Nome</option>
                <option value="lucro">Lucro Total</option>
                <option value="satisfacao">Satisfação Média</option>
                <option value="bonus">Bônus Total</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propósito</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucro Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satisfação Média</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bônus Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posição Geral</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partidas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedStudents.map(student => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.teamName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPurposeColor(student.purpose)}`}>
                        {getPurposeLabel(student.purpose)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(student.totalLucro)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.avgSatisfacao}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(student.totalBonus)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-1">
                      {getRankIcon(student.overallPosition)} {student.overallPosition}º
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.performance.totalMatchesPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showMatchHistory && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Histórico de Partidas de {processedStudents.find(s => s.id === showMatchHistory)?.name}</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partida #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satisfação</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bônus</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedStudents.find(s => s.id === showMatchHistory)?.matchHistory.map((match, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.match_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(match.lucro || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{match.satisfacao || 0}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(match.bonus || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(match.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedSection === 'teams' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" /> Times ({teams.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.length === 0 ? (
              <p className="text-gray-600 col-span-full text-center py-4">Nenhum time formado nesta turma.</p>
            ) : (
              teams.map(team => (
                <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{team.name || 'Time sem nome'}</h4>
                  <p className="text-sm text-gray-600 mb-2">Propósito: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPurposeColor(team.group_purpose)}`}>{getPurposeLabel(team.group_purpose)}</span></p>
                  <p className="text-sm font-medium text-gray-700 mb-1">Membros ({team.members.length}):</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {team.members.length === 0 ? (
                      <li>Nenhum membro</li>
                    ) : (
                      team.members.map(member => (
                        <li key={member.id}>{member.name}</li>
                      ))
                    )}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedSection === 'performance' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4" /> Análise de Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Top 5 Alunos (Geral)</h4>
              <ul className="space-y-2">
                {processedStudents.sort((a, b) => a.overallPosition - b.overallPosition).slice(0, 5).map(s => (
                  <li key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getRankIcon(s.overallPosition)}
                      <span className="font-medium text-gray-800">{s.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{s.totalScore} pts</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Métricas de Performance por Aluno</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partidas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Melhor Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pior Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Média Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedStudents.map(s => (
                      <tr key={s.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.performance.totalMatchesPlayed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.performance.bestMatchScore}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.performance.worstMatchScore}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.performance.avgMatchScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}