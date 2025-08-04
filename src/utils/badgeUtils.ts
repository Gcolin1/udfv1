import { BadgeConfig, BadgeLevel, BadgeProgress, InstructorStats, BadgeCategory } from '../types/badges'

export const BADGE_CONFIGS: BadgeConfig[] = [
  {
    name: 'Formador de Turmas',
    category: 'classes',
    goals: [10, 25, 50, 100, 250]
  },
  {
    name: 'Construtor de Líderes',
    category: 'leaders',
    goals: [10, 25, 50, 100, 250]
  },
  {
    name: 'Mestre de Alunos',
    category: 'students',
    goals: [10, 25, 50, 100, 250]
  },
  {
    name: 'Fontes Abundantes',
    category: 'totalProfit',
    goals: [500, 1500, 2500, 3500, 5000]
  },
  {
    name: 'Vendedor Nato',
    category: 'packagesSold',
    goals: [10, 25, 50, 100, 250]
  },
  {
    name: 'Líder Carismático',
    category: 'engagement',
    goals: [35, 55, 70, 80, 95]
  },
  {
    name: 'Pioneiro',
    category: 'pioneerRank',
    goals: [100, 50, 25, 10, 5]
  },
  {
    name: 'Turma Top 10',
    category: 'top10Classes',
    goals: [1, 3, 5, 10, 15]
  },
  {
    name: 'Turma Top 5',
    category: 'top5Classes',
    goals: [1, 2, 3, 5, 8]
  },
  {
    name: 'Turma Top 3',
    category: 'top3Classes',
    goals: [1, 2, 3, 4, 5]
  }
]

export interface BadgeCardData {
  id: string
  title: string
  current: number
  stages: number[]
  unit: string
  image?: string
  description?: string
}

// Badge image mapping - add your images here
const BADGE_IMAGES: Record<string, string> = {
  'formador-de-turmas': '/src/assets/badges/formador-de-turmas.png',
  'construtor-de-líderes': '/src/assets/badges/construtor-de-lideres.png',
  'mestre-de-alunos': '/src/assets/badges/mestre-de-alunos.png',
  'fontes-abundantes': '/src/assets/badges/fontes-abundantes.png',
  'vendedor-nato': '/src/assets/badges/vendedor-nato.png',
  'líder-carismático': '/src/assets/badges/lider-carismatico.png',
  'pioneiro': '/src/assets/badges/pioneiro.png',
  'turma-top-10': '/src/assets/badges/turma-top-10.png',
  'turma-top-5': '/src/assets/badges/turma-top-5.png',
  'turma-top-3': '/src/assets/badges/turma-top-3.png'
}

export function createBadgeCardData(stats: Pick<InstructorStats, 'classes' | 'students' | 'matches' | 'events' | 'leaders' | 'totalProfit' | 'packagesSold' | 'engagement' | 'pioneerRank' | 'top10Classes' | 'top5Classes' | 'top3Classes'>): BadgeCardData[] {
  return BADGE_CONFIGS.map(config => {
    const id = config.name.toLowerCase().replace(/\s+/g, '-')
    return {
      id,
      title: config.name,
      current: stats[config.category],
      stages: config.goals,
      unit: getUnitForCategory(config.category),
      image: BADGE_IMAGES[id] // Add the corresponding image
    }
  })
}

function getUnitForCategory(category: BadgeCategory): string {
  const units: Record<BadgeCategory, string> = {
    classes: 'Turmas',
    students: 'Alunos', 
    matches: 'Partidas',
    events: 'Eventos',
    leaders: 'Líderes',
    totalProfit: 'R$',
    packagesSold: 'Pacotes',
    engagement: '%',
    pioneerRank: 'º lugar',
    top10Classes: 'Turmas Top 10',
    top5Classes: 'Turmas Top 5',
    top3Classes: 'Turmas Top 3'
  }
  return units[category]
}

export const BADGE_LEVELS: BadgeLevel[] = ['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Expert']

export function calculateBadgeProgress(stats: InstructorStats, config: BadgeConfig): BadgeProgress {
  const progress = stats[config.category]
  const goals = config.goals
  
  let currentLevel: BadgeLevel | null = null
  let nextGoal: number | null = null
  let percentage = 0
  
  // Find current level
  for (let i = 0; i < goals.length; i++) {
    if (progress >= goals[i]) {
      currentLevel = BADGE_LEVELS[i]
      if (i < goals.length - 1) {
        nextGoal = goals[i + 1]
      }
    } else {
      nextGoal = goals[i]
      break
    }
  }
  
  // Calculate percentage for next goal
  if (nextGoal !== null) {
    const previousGoal = currentLevel ? goals[BADGE_LEVELS.indexOf(currentLevel)] : 0
    percentage = Math.round(((progress - previousGoal) / (nextGoal - previousGoal)) * 100)
  } else {
    // Already at max level
    percentage = 100
  }
  
  return {
    badge: config.name,
    progress,
    level: currentLevel,
    nextGoal,
    percentage: Math.max(0, Math.min(100, percentage))
  }
}