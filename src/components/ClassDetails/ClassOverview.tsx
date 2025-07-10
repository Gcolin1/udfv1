import { Users, Activity, Trophy, Target, TrendingUp, Zap, Info } from 'lucide-react';

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
  hasParticipated: boolean
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
  studentIndicators: StudentIndicator[]
  stats: Stats
}

// Suas funções formatCurrency e formatNumber permanecem as mesmas...
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(value);
  }
  return new Intl.NumberFormat('pt-BR').format(value);
};

export function ClassOverview({ studentIndicators, stats }: ClassOverviewProps) {
  

  return (
    <div className="space-y-6">
      {/* Grid de Estatísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Estatísticas da Turma</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full -right-2 mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Número total de alunos ativos na turma.
            </span>
          </div>
          <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-800 break-words">{formatNumber(studentIndicators.length)}</p>
          <p className="text-sm text-gray-600">Alunos</p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full -right-2 mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Média de lucro por cada resultado individual enviado na turma.
            </span>
          </div>
          <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-xl font-bold text-blue-800 break-words">{formatCurrency(stats.avgLucro)}</p>
          <p className="text-sm text-blue-600">Lucro Médio</p>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full -right-2 mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Média de satisfação por cada resultado individual enviado na turma.
            </span>
          </div>
          <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-xl font-bold text-green-800 break-words">{formatNumber(stats.avgSatisfacao)}%</p>
          <p className="text-sm text-green-600">Satisfação Média</p>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full -right-2 mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Média de bônus por cada resultado individual enviado na turma.
            </span>
          </div>
          <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-xl font-bold text-yellow-800 break-words">{formatCurrency(stats.avgBonus)}</p>
          <p className="text-sm text-yellow-600">Bônus Médio</p>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full -right-2 mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Taxa de participação real vs. potencial. Compara os resultados enviados with o total de vagas possíveis nas partidas.
            </span>
          </div>
          <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-xl font-bold text-purple-800 break-words">{formatNumber(stats.engajamento)}%</p>
          <p className="text-sm text-purple-600">Engajamento</p>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full -right-2 mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Número total de partidas únicas que já ocorreram nesta turma.
            </span>
          </div>
          <Activity className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <p className="text-xl font-bold text-orange-800 break-words">{formatNumber(stats.totalMatches)}</p>
          <p className="text-sm text-orange-600">Total Partidas</p>
        </div>
      </div>

      {/* Estatísticas Adicionais */}
      {stats.totalResults > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estatísticas Detalhadas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            <div className="text-center p-3 bg-gray-50 rounded-lg relative">
              <div className="absolute top-2 right-2 group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <span className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
                  Soma de todos os registros de resultados individuais enviados pelos alunos.
                </span>
              </div>
              <p className="text-lg font-bold text-gray-800 break-words">{formatNumber(stats.totalResults)}</p>
              <p className="text-xs text-gray-600">Total Resultados</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg relative">
              <div className="absolute top-2 right-2 group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <span className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
                  Média de participações em partidas por cada aluno inscrito na turma.
                </span>
              </div>
              <p className="text-lg font-bold text-gray-800 break-words">{formatNumber(stats.avgMatches)}</p>
              <p className="text-xs text-gray-600">Partidas por Aluno</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg relative">
              <div className="absolute top-2 right-2 group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <span className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
                  Soma das médias de Lucro, Satisfação e Bônus por resultado individual.
                </span>
              </div>
              <p className="text-lg font-bold text-gray-800 break-words">{formatNumber(stats.avgTotal)}</p>
              <p className="text-xs text-gray-600">Pontuação Total Média</p>
            </div>
          </div>
        </div>
      )}
      </div>

    </div>
  );
}