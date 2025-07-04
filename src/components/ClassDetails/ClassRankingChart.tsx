// src/components/ClassDetails/ClassRankingChart.tsx
import { Trophy, Crown } from 'lucide-react'

interface RankingData {
  name: string
  score: number
  position: number
  matches: number
}

interface ClassRankingChartProps {
  rankingData: RankingData[]
  getRankIcon: (position: number) => JSX.Element
}

export function ClassRankingChart({ 
  rankingData, 
  getRankIcon, 
}: ClassRankingChartProps) {
  const topPlayer = rankingData.length > 0 ? rankingData[0] : null

  return (
    <div className="space-y-6">


      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Ranking dos Alunos/Times (Top 10)
        </h2>

        {topPlayer && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-center gap-4">
            <Crown className="w-10 h-10 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">🏆 Melhor Aluno</p>
              <h3 className="text-2xl font-bold text-blue-800">{topPlayer.name}</h3>
              <p className="text-blue-700">
                <span className="font-semibold">{topPlayer.score}</span> pontos totais em{' '}
                <span className="font-semibold">{topPlayer.matches}</span> partidas
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Menor soma de posições = melhor classificação geral
              </p>
            </div>
          </div>
        )}


        {/* Ranking Table */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Classificação Detalhada</h3>
          {rankingData.slice(0, 10).map((student) => (
            <div key={student.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getRankIcon(student.position)}
                <div>
                  <span className="font-medium text-gray-800">
                    {student.position}º {student.name}
                  </span>
                  <p className="text-sm text-gray-600">{student.matches} partidas jogadas</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-800">{student.score}</span>
                <p className="text-sm text-gray-600">pontos totais</p>
                <p className="text-xs text-gray-500">soma das posições</p>
              </div>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Como funciona o ranking:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>1. Cada aluno recebe uma posição em cada indicador (Lucro, Satisfação, Bônus)</p>
            <p>2. As três posições são somadas para formar a pontuação total</p>
            <p>3. Menor pontuação total = melhor classificação geral</p>
            <p>4. Em caso de empate, desempata-se por: maior lucro → maior satisfação → maior bônus</p>
          </div>
        </div>
      </div>
    </div>
  )
}