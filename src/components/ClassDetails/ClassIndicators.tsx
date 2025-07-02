// src/components/ClassDetails/ClassIndicators.tsx
import { Users, TrendingUp, Target, Trophy, User } from 'lucide-react'

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
}

interface ClassIndicatorsProps {
  studentIndicators: StudentIndicator[]
  isLoading: boolean
}

export function ClassIndicators({ studentIndicators, isLoading }: ClassIndicatorsProps) {
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

  const getStatusColor = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green': return 'bg-green-500'
      case 'yellow': return 'bg-yellow-500'
      case 'red': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green': return 'Cumprindo objetivo'
      case 'yellow': return 'Parcialmente'
      case 'red': return 'Abaixo do esperado'
      default: return 'Indefinido'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Carregando indicadores...</p>
          </div>
        </div>
      </div>
    )
  }

  if (studentIndicators.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Indicadores por Aluno
        </h2>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum indicador disponível ainda.</p>
          <p className="text-gray-500 text-sm mt-2">
            Os indicadores aparecerão quando houver resultados de partidas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo dos Indicadores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Indicadores por Aluno
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentIndicators.map((student) => (
            <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 truncate">{student.name}</h3>
                    <p className="text-xs text-gray-500 truncate" title={student.email || ''}>{student.email}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${getStatusColor(student.statusColor)}`} 
                     title={getStatusLabel(student.statusColor)}></div>
              </div>

              {/* Indicadores */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Lucro Total</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-800">R$ {student.totalLucro}</span>
                    <span className="text-xs text-gray-500 ml-1">#{student.lucroPosition}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Satisfação Média</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-800">{student.avgSatisfacao}%</span>
                    <span className="text-xs text-gray-500 ml-1">#{student.satisfacaoPosition}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Bônus Total</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-800">R$ {student.totalBonus}</span>
                    <span className="text-xs text-gray-500 ml-1">#{student.bonusPosition}</span>
                  </div>
                </div>
              </div>

              {/* Propósitos */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Propósito Individual:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(student.purpose)}`}>
                    {getPurposeLabel(student.purpose)}
                  </span>
                </div>
                
                {student.groupPurpose && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Propósito do Grupo:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(student.groupPurpose)}`}>
                      {getPurposeLabel(student.groupPurpose)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Posição Geral:</span>
                  <span className="text-xs font-semibold text-gray-800">#{student.totalPosition}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}