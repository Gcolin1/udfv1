import React from 'react'
import { Users, Activity, Trophy, Target, TrendingUp, Zap, Info } from 'lucide-react'
import { StudentIndicator, ClassStats } from '../../types'

interface ClassOverviewProps {
  studentIndicators: StudentIndicator[]
  stats: ClassStats
}

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

const formatCurrencyMobile = (value: number): string => {
  if (value >= 1000) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

function ClassOverviewComponent({ studentIndicators, stats }: ClassOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Estatísticas da Turma</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4">
        <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full right-0 mb-2 w-max max-w-[200px] sm:max-w-xs px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Número total de alunos ativos na turma.
            </span>
          </div>
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <p className="text-lg sm:text-xl font-bold text-gray-800 whitespace-nowrap">{formatNumber(studentIndicators.length)}</p>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">Alunos</p>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full right-0 mb-2 w-max max-w-[200px] sm:max-w-xs px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Média de lucro por cada resultado individual enviado na turma.
            </span>
          </div>
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <p className="text-sm sm:text-xl font-bold text-blue-800 whitespace-nowrap" title={formatCurrency(stats.avgLucro)}>
              <span className="sm:hidden">{formatCurrencyMobile(stats.avgLucro)}</span>
              <span className="hidden sm:inline">{formatCurrency(stats.avgLucro)}</span>
            </p>
          </div>
          <p className="text-xs sm:text-sm text-blue-600">Lucro Médio</p>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full right-0 mb-2 w-max max-w-[200px] sm:max-w-xs px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Média de satisfação por cada resultado individual enviado na turma.
            </span>
          </div>
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto mb-2" />
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <p className="text-lg sm:text-xl font-bold text-green-800 whitespace-nowrap">{formatNumber(stats.avgSatisfacao)}%</p>
          </div>
          <p className="text-xs sm:text-sm text-green-600">Satisfação Média</p>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full right-0 mb-2 w-max max-w-[200px] sm:max-w-xs px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Média de bônus por cada resultado individual enviado na turma.
            </span>
          </div>
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mx-auto mb-2" />
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <p className="text-sm sm:text-xl font-bold text-yellow-800 whitespace-nowrap" title={formatCurrency(stats.avgBonus)}>
              <span className="sm:hidden">{formatCurrencyMobile(stats.avgBonus)}</span>
              <span className="hidden sm:inline">{formatCurrency(stats.avgBonus)}</span>
            </p>
          </div>
          <p className="text-xs sm:text-sm text-yellow-600">Bônus Médio</p>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full right-0 mb-2 w-max max-w-[200px] sm:max-w-xs px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Taxa de participação real vs. potencial. Compara os resultados enviados com o total de vagas possíveis nas partidas.
            </span>
          </div>
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mx-auto mb-2" />
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <p className="text-lg sm:text-xl font-bold text-purple-800 whitespace-nowrap">{formatNumber(stats.engajamento)}%</p>
          </div>
          <p className="text-xs sm:text-sm text-purple-600">Engajamento</p>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg w-full relative">
          <div className="absolute top-2 right-2 group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <span className="absolute bottom-full right-0 mb-2 w-max max-w-[200px] sm:max-w-xs px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
              Número total de partidas únicas que já ocorreram nesta turma.
            </span>
          </div>
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mx-auto mb-2" />
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <p className="text-lg sm:text-xl font-bold text-orange-800 whitespace-nowrap">{formatNumber(stats.totalMatches)}</p>
          </div>
          <p className="text-xs sm:text-sm text-orange-600">Total Partidas</p>
        </div>
      </div>
      </div>

    </div>
  )
}

export const ClassOverview = React.memo(ClassOverviewComponent)