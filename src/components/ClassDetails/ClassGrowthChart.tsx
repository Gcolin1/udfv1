// src/components/ClassDetails/ClassGrowthChart.tsx
import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { TrendingUp, Users, Target, Trophy } from 'lucide-react'

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

interface GrowthData {
  match_number: number
  [key: string]: number // Para permitir propriedades dinâmicas dos jogadores
}

// CORREÇÃO 1: Removido 'classId' da interface de props
interface ClassGrowthChartProps {
  students: Student[]
  matchResults: MatchResult[]
}

// CORREÇÃO 2: Removido 'classId' dos parâmetros da função
export function ClassGrowthChart({ students, matchResults }: ClassGrowthChartProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<'lucro' | 'satisfacao' | 'bonus'>('lucro')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [growthData, setGrowthData] = useState<GrowthData[]>([])
  const [classAverages, setClassAverages] = useState<GrowthData[]>([])

  useEffect(() => {
    if (matchResults.length > 0 && students.length > 0) {
      calculateGrowthData()
    }
  }, [matchResults, students, selectedIndicator, selectedStudents])

  const calculateGrowthData = () => {
    // Obter todos os números de partida únicos
    const matchNumbers = [...new Set(matchResults.map(result => result.match_number))].sort((a, b) => a - b)
    
    // Calcular dados de crescimento por aluno
    const growthByMatch: GrowthData[] = matchNumbers.map(matchNumber => {
      const matchData: GrowthData = { match_number: matchNumber }
      
      // Para cada aluno selecionado, calcular o valor acumulado até esta partida
      selectedStudents.forEach(studentId => {
        const student = students.find(s => s.id === studentId)
        if (!student) return
        
        const studentResults = matchResults
          .filter(result => result.player_id === studentId && result.match_number <= matchNumber)
          .sort((a, b) => a.match_number - b.match_number)
        
        if (studentResults.length > 0) {
          let value = 0
          
          switch (selectedIndicator) {
            case 'lucro':
              value = studentResults.reduce((sum, result) => sum + (result.lucro || 0), 0)
              break
            case 'satisfacao':
              // Para satisfação, geralmente se pega o último valor, não a média dos acumulados
              value = studentResults[studentResults.length - 1].satisfacao || 0
              break
            case 'bonus':
              value = studentResults.reduce((sum, result) => sum + (result.bonus || 0), 0)
              break
          }
          
          matchData[student.name || `Aluno ${studentId.slice(0, 8)}`] = Math.round(value)
        }
      })
      
      return matchData
    })
    
    // Calcular médias da turma
    const averagesByMatch: GrowthData[] = matchNumbers.map(matchNumber => {
      const matchData: GrowthData = { match_number: matchNumber }
      
      const allStudentResults = students.map(student => {
        const studentResults = matchResults
          .filter(result => result.player_id === student.id && result.match_number <= matchNumber)
        
        if (studentResults.length === 0) return 0
        
        switch (selectedIndicator) {
          case 'lucro':
            return studentResults.reduce((sum, result) => sum + (result.lucro || 0), 0)
          case 'satisfacao':
             // Pega o último resultado de satisfação do aluno
            const lastResult = studentResults.sort((a,b) => b.match_number - a.match_number)[0];
            return lastResult.satisfacao || 0
          case 'bonus':
            return studentResults.reduce((sum, result) => sum + (result.bonus || 0), 0)
          default:
            return 0
        }
      }).filter(value => value > 0) // Filtra para não incluir alunos sem dados na média
      
      if (allStudentResults.length > 0) {
        matchData['Média da Turma'] = Math.round(
          allStudentResults.reduce((sum, value) => sum + value, 0) / allStudentResults.length
        )
      }
      
      return matchData
    })
    
    setGrowthData(growthByMatch)
    setClassAverages(averagesByMatch)
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const getIndicatorLabel = () => {
    switch (selectedIndicator) {
      case 'lucro': return 'Lucro (R$)'
      case 'satisfacao': return 'Satisfação (%)'
      case 'bonus': return 'Bônus (R$)'
      default: return ''
    }
  }

  const getIndicatorIcon = () => {
    switch (selectedIndicator) {
      case 'lucro': return <TrendingUp className="w-4 h-4" />
      case 'satisfacao': return <Target className="w-4 h-4" />
      case 'bonus': return <Trophy className="w-4 h-4" />
      default: return null
    }
  }

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']

  if (students.length === 0 || matchResults.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Crescimento por Aluno
        </h2>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum dado de crescimento disponível ainda.</p>
          <p className="text-gray-500 text-sm mt-2">
            Os gráficos aparecerão quando houver resultados de partidas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Crescimento por Aluno
        </h2>

        {/* Seletor de Indicador */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Indicador:</label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedIndicator('lucro')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedIndicator === 'lucro'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Lucro
            </button>
            <button
              onClick={() => setSelectedIndicator('satisfacao')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedIndicator === 'satisfacao'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Target className="w-4 h-4" />
              Satisfação
            </button>
            <button
              onClick={() => setSelectedIndicator('bonus')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedIndicator === 'bonus'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Bônus
            </button>
          </div>
        </div>

        {/* Seletor de Alunos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Alunos ({selectedStudents.length} selecionados):
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {students.map((student) => (
              <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => handleStudentToggle(student.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 truncate">{student.name}</span>
              </label>
            ))}
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSelectedStudents(students.map(s => s.id))}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Selecionar Todos
            </button>
            <button
              onClick={() => setSelectedStudents([])}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Limpar Seleção
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      {selectedStudents.length > 0 && growthData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            {getIndicatorIcon()}
            Evolução de {getIndicatorLabel()}
          </h3>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="match_number" 
                  label={{ value: 'Número da Partida', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: getIndicatorLabel(), angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${value}`, name]}
                  labelFormatter={(label) => `Partida ${label}`}
                />
                <Legend />
                
                {/* Linhas dos alunos selecionados */}
                {selectedStudents.map((studentId, index) => {
                  const student = students.find(s => s.id === studentId)
                  if (!student) return null
                  
                  return (
                    <Line
                      key={studentId}
                      type="monotone"
                      dataKey={student.name || `Aluno ${studentId.slice(0, 8)}`}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                      connectNulls={false}
                    />
                  )
                })}
                
                {/* Linha da média da turma */}
                <Line
                  type="monotone"
                  dataKey="Média da Turma"
                  data={classAverages}
                  stroke="#6B7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#6B7280', strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>• Linhas sólidas representam alunos individuais</p>
            <p>• Linha pontilhada representa a média da turma</p>
            <p>• Os valores de Lucro e Bônus são acumulativos. Satisfação representa o valor da última partida.</p>
          </div>
        </div>
      )}

      {selectedStudents.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Selecione pelo menos um aluno para visualizar o gráfico de crescimento.</p>
        </div>
      )}
    </div>
  )
}