// src/components/ClassDetails/ClassStudentsList.tsx
import { Users, Trophy, TrendingUp, Target } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Student {
  id: string
  name: string | null
  email: string | null
  joined_at: string | null
  total_matches: number
  avg_score: number
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

interface ClassStudentsListProps {
  students: Student[]
  matchResults?: MatchResult[]
}

export function ClassStudentsList({ students, matchResults = [] }: ClassStudentsListProps) {
  const uniqueMatchNumbers = [...new Set(matchResults.map(r => r.match_number))]
  const totalUniqueMatches = uniqueMatchNumbers.length

  const studentsWithResults = students.map(student => {
    const studentResults = matchResults.filter(result => result.player_id === student.id)
    
    const totalLucro = studentResults.reduce((sum, result) => sum + (result.lucro || 0), 0)
    const totalSatisfacao = studentResults.reduce((sum, result) => sum + (result.satisfacao || 0), 0)
    const totalBonus = studentResults.reduce((sum, result) => sum + (result.bonus || 0), 0)
    const avgSatisfacao = studentResults.length > 0 ? totalSatisfacao / studentResults.length : 0
    const totalScore = totalLucro + totalSatisfacao + totalBonus

    const individualEngagement = totalUniqueMatches > 0 
      ? Math.min(100, Math.round((studentResults.length / totalUniqueMatches) * 100))
      : 0

    return {
      ...student,
      totalLucro,
      avgSatisfacao: Math.round(avgSatisfacao),
      totalBonus,
      totalScore: Math.round(totalScore),
      matchesPlayed: studentResults.length,
      engagement: individualEngagement
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return 'text-green-600'
    if (engagement >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEngagementBgColor = (engagement: number) => {
    if (engagement >= 80) return 'bg-green-50'
    if (engagement >= 60) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Alunos e Resultados Detalhados ({students.length})
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Aluno</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">E-mail</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Partidas</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Lucro Total</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Satisfação Média</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Bônus Total</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Engajamento</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Ingressou em</th>
            </tr>
          </thead>
          <tbody>
            {studentsWithResults.map((student) => (
              <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                    {student.matchesPlayed > 0 && (
                      <p className="text-xs text-gray-500">{student.matchesPlayed} resultados registrados</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{student.email}</td>
                <td className="py-3 px-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-gray-400" />
                    {student.total_matches}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className={`font-medium ${getScoreColor(student.totalLucro)}`}>
                      R$ {student.totalLucro}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className={`font-medium ${getScoreColor(student.avgSatisfacao)}`}>
                      {student.avgSatisfacao}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className={`font-medium ${getScoreColor(student.totalBonus)}`}>
                      R$ {student.totalBonus}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getEngagementBgColor(student.engagement)} ${getEngagementColor(student.engagement)}`}>
                    {student.engagement}%
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {student.joined_at && format(new Date(student.joined_at), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {matchResults.length === 0 && (
        <div className="text-center py-8 border-t border-gray-200 mt-4">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum resultado de partida registrado ainda.</p>
          <p className="text-gray-500 text-sm mt-2">
            Os resultados aparecerão aqui quando as partidas forem jogadas.
          </p>
        </div>
      )}
    </div>
  )
}
