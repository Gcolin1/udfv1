// src/components/ClassDetails/ClassOverview.tsx
import { Users, Activity, Trophy, Target, TrendingUp, Zap } from 'lucide-react'

interface Student {
  id: string
  name: string | null
  email: string | null
  joined_at: string | null
  total_matches: number
  avg_score: number
}

interface Stats {
  avgLucro: number
  avgSatisfacao: number
  avgBonus: number
  engajamento: number
  totalMatches: number
  avgMatches: number
  totalResults: number
  avgTotal: number
}

interface ClassOverviewProps {
  students: Student[]
  stats: Stats
}

export function ClassOverview({ students, stats }: ClassOverviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Visão Geral e Estatísticas da Turma</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{students.length}</p>
          <p className="text-sm text-gray-600">Alunos</p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-800">R$ {stats.avgLucro}</p>
          <p className="text-sm text-blue-600">Lucro Médio</p>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-800">{stats.avgSatisfacao}%</p>
          <p className="text-sm text-green-600">Satisfação Média</p>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-800">R$ {stats.avgBonus}</p>
          <p className="text-sm text-yellow-600">Bônus Médio</p>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-800">{stats.engajamento}%</p>
          <p className="text-sm text-purple-600">Engajamento</p>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <Activity className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-800">{stats.totalMatches}</p>
          <p className="text-sm text-orange-600">Total Partidas</p>
        </div>
      </div>

      {/* Estatísticas Adicionais */}
      {stats.totalResults > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estatísticas Detalhadas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-800">{stats.totalResults}</p>
              <p className="text-xs text-gray-600">Total Resultados</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-800">{stats.avgMatches}</p>
              <p className="text-xs text-gray-600">Partidas por Aluno</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-800">{stats.avgTotal}</p>
              <p className="text-xs text-gray-600">Pontuação Total Média</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-800">{stats.engajamento}%</p>
              <p className="text-xs text-gray-600">Taxa de Participação</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}