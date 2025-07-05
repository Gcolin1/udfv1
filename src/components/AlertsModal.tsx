import { X, AlertTriangle, TrendingDown, Trophy, Users, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface AlertsModalProps {
  isOpen: boolean
  onClose: () => void
  classId?: string // Opcional: se fornecido, mostra dados apenas desta turma
}

interface AlertData {
  criticalCount: number
  lowPerformanceCount: number
  bestPerformer: string
  bestPerformerProfit: number
  bestPerformerSatisfaction: number
  engagementRate: number
  inactiveCount: number
}

export function AlertsModal({ isOpen, onClose, classId }: AlertsModalProps) {
  const { user } = useAuth()
  const [alertData, setAlertData] = useState<AlertData>({
    criticalCount: 0,
    lowPerformanceCount: 0,
    bestPerformer: '',
    bestPerformerProfit: 0,
    bestPerformerSatisfaction: 0,
    engagementRate: 0,
    inactiveCount: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadAlertData()
    }
  }, [isOpen, user])

  const loadAlertData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Buscar turmas do instrutor (ou apenas uma específica)
      let classes
      if (classId) {
        // Modal sendo usado para uma turma específica
        const { data } = await supabase
          .from('classes')
          .select('id')
          .eq('id', classId)
          .eq('instructor_id', user.id)
        classes = data
      } else {
        // Modal sendo usado no dashboard geral
        const { data } = await supabase
          .from('classes')
          .select('id')
          .eq('instructor_id', user.id)
        classes = data
      }

      if (!classes?.length) {
        setIsLoading(false)
        return
      }

      let totalCriticalCount = 0
      let totalLowPerformanceCount = 0
      let globalBestPerformer = ''
      let globalBestPerformerProfit = 0
      let globalBestPerformerSatisfaction = 0
      let totalInactiveCount = 0
      let totalEngagementSum = 0
      let classesWithData = 0

      // Processar cada turma individualmente para calcular engajamento corretamente
      for (const classItem of classes) {
        const classId = classItem.id

        // Buscar dados específicos desta turma
        const { data: playersData } = await supabase
          .from('class_players')
          .select(`
            *,
            players:player_id (id, name, email, purpose, team_id)
          `)
          .eq('class_id', classId)

        const { data: matchResultsData } = await supabase
          .from('match_results')
          .select('*')
          .eq('class_id', classId)

        const { data: teamsData } = await supabase
          .from('teams')
          .select('*')
          .eq('class_id', classId)
        
        if (!playersData?.length || !matchResultsData?.length) {
          continue
        }

        classesWithData++
        
        playersData.forEach(playerData => {
          const player = playerData.players
          if (!player) return
          
          const playerResults = matchResultsData.filter(result => result.player_id === player.id)
          
          // Se não tem resultados, é inativo
          if (playerResults.length === 0) {
            totalInactiveCount++
            return
          }
          
          // Calcular métricas
          const totalLucro = playerResults.reduce((sum, result) => sum + (result.lucro || 0), 0)
          const satisfacaoResults = playerResults.filter(result => result.satisfacao !== null)
          const totalSatisfacao = satisfacaoResults.reduce((sum, result) => sum + (result.satisfacao || 0), 0)
          const avgSatisfacao = satisfacaoResults.length > 0 ? totalSatisfacao / satisfacaoResults.length : 0
          const totalBonus = playerResults.reduce((sum, result) => sum + (result.bonus || 0), 0)
          
          // Determinar status baseado no propósito (mesma lógica do ClassIndicators)
          const playerTeam = teamsData?.find(team => 
            team.members?.some((member: any) => member.id === player.id)
          )
          const purpose = player.purpose || playerTeam?.group_purpose
          
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
            
            // Aplicar a mesma lógica do ClassIndicators
            if (targetValue < 50) {
              totalCriticalCount++ // Vermelho - Abaixo do esperado
            } else if (targetValue < 80) {
              totalLowPerformanceCount++ // Amarelo - Parcialmente
            }
            // Verde >= 80 não conta como alerta
          }
          
          // Encontrar melhor performer global (baseado em lucro total)
          if (totalLucro > globalBestPerformerProfit) {
            globalBestPerformer = player.name || 'Sem nome'
            globalBestPerformerProfit = totalLucro
            globalBestPerformerSatisfaction = Math.round(avgSatisfacao)
          }
        })
        
        // Calcular engajamento desta turma usando a mesma lógica do ClassDetailsPage
        const classPlayers = playersData.length
        const classParticipations = matchResultsData.length
        const uniqueMatchNumbers = [...new Set(matchResultsData.map(r => r.match_number))]
        const classUniqueMatches = uniqueMatchNumbers.length
        
        if (classPlayers > 0 && classUniqueMatches > 0) {
          const classEngagement = Math.min(100, Math.round((classParticipations / (classPlayers * classUniqueMatches)) * 100))
          totalEngagementSum += classEngagement
        }
      }

      // Calcular engajamento médio entre todas as turmas
      const avgEngagementRate = classesWithData > 0 ? Math.round(totalEngagementSum / classesWithData) : 0
      
      setAlertData({
        criticalCount: totalCriticalCount,
        lowPerformanceCount: totalLowPerformanceCount,
        bestPerformer: globalBestPerformer,
        bestPerformerProfit: globalBestPerformerProfit,
        bestPerformerSatisfaction: globalBestPerformerSatisfaction,
        engagementRate: avgEngagementRate,
        inactiveCount: totalInactiveCount
      })
    } catch (error) {
      console.error('Erro ao carregar dados de alertas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalAlerts = alertData.criticalCount + alertData.lowPerformanceCount

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Alertas de Desempenho ({totalAlerts})
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {alertData.criticalCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <h3 className="font-semibold text-red-800">Desempenho Crítico</h3>
                  </div>
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {alertData.criticalCount}
                  </div>
                  <p className="text-sm text-red-600">
                    {alertData.criticalCount === 1 ? 'aluno precisa' : 'alunos precisam'} de atenção urgente
                  </p>
                </div>
              )}

              {alertData.lowPerformanceCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <TrendingDown className="w-5 h-5 text-yellow-500 mr-2" />
                    <h3 className="font-semibold text-yellow-800">Desempenho Baixo</h3>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {alertData.lowPerformanceCount}
                  </div>
                  <p className="text-sm text-yellow-600">
                    {alertData.lowPerformanceCount === 1 ? 'aluno está' : 'alunos estão'} abaixo da média
                  </p>
                </div>
              )}

              {alertData.bestPerformer && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Trophy className="w-5 h-5 text-green-500 mr-2" />
                    <h3 className="font-semibold text-green-800">Melhor Desempenho Geral</h3>
                  </div>
                  <p className="text-green-700 mb-2">
                    <span className="font-semibold">{alertData.bestPerformer}</span> é o destaque geral da turma
                  </p>
                  <p className="text-sm text-green-600">
                    Lucro: R$ {alertData.bestPerformerProfit.toLocaleString('pt-BR')} | 
                    Satisfação: {alertData.bestPerformerSatisfaction}%
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 text-blue-500 mr-2" />
                  <h3 className="font-semibold text-blue-800">Engajamento</h3>
                </div>
                <p className="text-blue-700 mb-2">
                  Engajamento da turma em {alertData.engagementRate}%
                  {alertData.engagementRate < 70 && ' - considere estratégias para aumentar a participação'}
                </p>
                <div className="text-2xl font-bold text-blue-600">
                  {alertData.engagementRate}%
                </div>
              </div>

              {alertData.inactiveCount > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <UserX className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="font-semibold text-gray-800">Alunos Inativos</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-600 mb-1">
                    {alertData.inactiveCount}
                  </div>
                  <p className="text-sm text-gray-600">
                    {alertData.inactiveCount === 1 ? 'aluno ainda não enviou' : 'alunos ainda não enviaram'} resultados
                  </p>
                </div>
              )}

              {totalAlerts === 0 && alertData.inactiveCount === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-600 font-semibold">Tudo certo!</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Não há alertas de desempenho no momento.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}