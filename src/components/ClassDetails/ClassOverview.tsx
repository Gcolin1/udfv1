import { useMemo } from 'react';
import { Users, Activity, Trophy, Target, TrendingUp, Zap, Info, AlertTriangle, Star, AlertCircle } from 'lucide-react';

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
  
  const performanceAlerts = useMemo(() => {
    const alerts: { 
      type: 'critical' | 'warning' | 'highlight' | 'info'; 
      message: string;
      count?: number;
      studentName?: string;
      students?: StudentIndicator[];
      category?: string;
      value?: string;
    }[] = [];
    
    if (!studentIndicators || studentIndicators.length === 0) {
      return [];
    }

    const criticalPerformers = studentIndicators.filter(s => s.statusColor === 'red');
    if (criticalPerformers.length > 0) {
      alerts.push({
        type: 'critical',
        message: `${criticalPerformers.length} ${criticalPerformers.length > 1 ? 'alunos precisam' : 'aluno precisa'} de atenção urgente`,
        count: criticalPerformers.length,
        students: criticalPerformers,
        category: 'Desempenho Crítico'
      });
    }

    const warningPerformers = studentIndicators.filter(s => s.statusColor === 'yellow');
    if (warningPerformers.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${warningPerformers.length} ${warningPerformers.length > 1 ? 'alunos estão' : 'aluno está'} abaixo da média`,
        count: warningPerformers.length,
        students: warningPerformers,
        category: 'Desempenho Baixo'
      });
    }

    const topOverall = studentIndicators.reduce((prev, current) => {
      const prevScore = (prev.totalLucro || 0) + (prev.avgSatisfacao || 0) + (prev.avgBonus || 0);
      const currentScore = (current.totalLucro || 0) + (current.avgSatisfacao || 0) + (current.avgBonus || 0);
      return prevScore > currentScore ? prev : current;
    });

    if (topOverall && (topOverall.totalLucro > 0 || topOverall.avgSatisfacao > 0)) {
      alerts.push({
        type: 'highlight',
        message: `${topOverall.name} é o destaque geral da turma`,
        studentName: topOverall.name,
        students: [topOverall],
        category: 'Melhor Desempenho Geral',
        value: `Lucro: ${formatCurrency(topOverall.totalLucro)} | Satisfação: ${formatNumber(topOverall.avgSatisfacao)}%`
      });
    }

    const topLucro = studentIndicators.reduce((prev, current) => 
      (prev.totalLucro > current.totalLucro) ? prev : current
    );
    const topSatisfacao = studentIndicators.reduce((prev, current) => 
      (prev.avgSatisfacao > current.avgSatisfacao) ? prev : current
    );
    const topBonus = studentIndicators.reduce((prev, current) => 
      (prev.avgBonus > current.avgBonus) ? prev : current
    );

    if (topLucro && topLucro.totalLucro > 0 && topLucro.name !== topOverall.name) {
      alerts.push({
        type: 'highlight',
        message: `${topLucro.name} lidera em Lucro`,
        studentName: topLucro.name,
        students: [topLucro],
        category: 'Líder em Lucro',
        value: formatCurrency(topLucro.totalLucro)
      });
    }

    if (topSatisfacao && topSatisfacao.avgSatisfacao > 0 && topSatisfacao.name !== topOverall.name) {
      alerts.push({
        type: 'highlight',
        message: `${topSatisfacao.name} lidera em Satisfação`,
        studentName: topSatisfacao.name,
        students: [topSatisfacao],
        category: 'Líder em Satisfação',
        value: `${formatNumber(topSatisfacao.avgSatisfacao)}%`
      });
    }

    if (topBonus && topBonus.avgBonus > 0 && topBonus.name !== topOverall.name && topBonus.name !== topLucro.name) {
      alerts.push({
        type: 'highlight',
        message: `${topBonus.name} lidera em Bônus`,
        studentName: topBonus.name,
        students: [topBonus],
        category: 'Líder em Bônus',
        value: formatCurrency(topBonus.avgBonus)
      });
    }

    if (stats.engajamento < 50) {
      alerts.push({
        type: 'info',
        message: `Engajamento da turma em ${formatNumber(stats.engajamento)}% - considere estratégias para aumentar a participação`,
        category: 'Engajamento',
        value: `${formatNumber(stats.engajamento)}%`
      });
    }

    const inactiveStudents = studentIndicators.filter(s => 
      (s.totalLucro === 0 && s.avgSatisfacao === 0 && s.avgBonus === 0)
    );
    if (inactiveStudents.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${inactiveStudents.length} ${inactiveStudents.length > 1 ? 'alunos ainda não enviaram' : 'aluno ainda não enviou'} resultados`,
        count: inactiveStudents.length,
        students: inactiveStudents,
        category: 'Alunos Inativos'
      });
    }

    const highPerformers = studentIndicators.filter(s => s.statusColor === 'green');
    if (highPerformers.length > 0) {
      alerts.push({
        type: 'highlight',
        message: `${highPerformers.length} ${highPerformers.length > 1 ? 'alunos têm' : 'aluno tem'} desempenho excelente`,
        count: highPerformers.length,
        students: highPerformers,
        category: 'Alto Desempenho'
      });
    }

    return alerts;
  }, [studentIndicators, stats]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertCircle;
      case 'highlight': return Star;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'critical': 
        return {
          border: 'border-red-400',
          bg: 'bg-red-50',
          title: 'text-red-800',
          icon: 'text-red-600',
          text: 'text-red-700',
          tagBg: 'bg-red-100',
          tagBorder: 'border-red-300'
        };
      case 'warning':
        return {
          border: 'border-yellow-400',
          bg: 'bg-yellow-50',
          title: 'text-yellow-800',
          icon: 'text-yellow-600',
          text: 'text-yellow-700',
          tagBg: 'bg-yellow-100',
          tagBorder: 'border-yellow-300'
        };
      case 'highlight':
        return {
          border: 'border-blue-400',
          bg: 'bg-blue-50',
          title: 'text-blue-800',
          icon: 'text-blue-600',
          text: 'text-blue-700',
          tagBg: 'bg-blue-100',
          tagBorder: 'border-blue-300'
        };
      case 'info':
        return {
          border: 'border-gray-400',
          bg: 'bg-gray-50',
          title: 'text-gray-800',
          icon: 'text-gray-600',
          text: 'text-gray-700',
          tagBg: 'bg-gray-100',
          tagBorder: 'border-gray-300'
        };
      default:
        return {
          border: 'border-gray-400',
          bg: 'bg-gray-50',
          title: 'text-gray-800',
          icon: 'text-gray-600',
          text: 'text-gray-700',
          tagBg: 'bg-gray-100',
          tagBorder: 'border-gray-300'
        };
    }
  };

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

      {/* --- SEÇÃO DE ALERTAS DE DESEMPENHO CORRIGIDA --- */}
      {performanceAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Alertas de Desempenho 
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({performanceAlerts.length})
            </span>
          </h3>
          
          {/* Lista de Alertas Scrollável */}
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
            {performanceAlerts.map((alert, index) => {
              const Icon = getAlertIcon(alert.type);
              const styles = getAlertStyles(alert.type);
              
              return (
                <div 
                  key={index} 
                  className={`border-l-4 ${styles.border} ${styles.bg} rounded-r-lg p-4 shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${styles.icon} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {alert.category && (
                          <span className={`text-xs px-2 py-1 rounded-full ${styles.tagBg} ${styles.title} font-medium border ${styles.tagBorder}`}>
                            {alert.category}
                          </span>
                        )}
                        {alert.value && (
                          <span className={`text-xs ${styles.text} font-semibold bg-white px-2 py-1 rounded border`}>
                            {alert.value}
                          </span>
                        )}
                      </div>
                      
                      <p className={`text-sm ${styles.text} mb-2 font-medium`}>
                        {alert.message}
                      </p>
                      
                      {/* Exibir jogadores de forma compacta */}
                      {alert.students && alert.students.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alert.students.slice(0, 4).map((student, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded-full bg-white ${styles.text} border font-medium`}
                            >
                              {student.name}
                            </span>
                          ))}
                          {alert.students.length > 4 && (
                            <span className={`text-xs px-2 py-1 rounded-full bg-white ${styles.text} border font-medium`}>
                              +{alert.students.length - 4} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}