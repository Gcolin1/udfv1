import { BadgeService } from '../services/badgeService'

// Example usage of the Badge System
export async function exampleUsage() {
  const badgeService = new BadgeService()
  const instructorId = 'your-instructor-id-here'

  try {
    // Get instructor badges with current progress
    const result = await badgeService.getInstructorBadges(instructorId)
    
    console.log('Badge Results for Instructor:', result.instructor_id)
    console.log('----------------------------------------')
    
    result.badges.forEach(badge => {
      console.log(`🏆 ${badge.badge}`)
      console.log(`   Progress: ${badge.progress}`)
      console.log(`   Level: ${badge.level || 'None'}`)
      console.log(`   Next Goal: ${badge.nextGoal || 'Max Level Reached'}`)
      console.log(`   Percentage: ${badge.percentage}%`)
      console.log('----------------------------------------')
    })

    // Update stats (recalculate from database)
    const updatedStats = await badgeService.updateInstructorStats(instructorId)
    console.log('Updated Stats:', updatedStats)

    return result
  } catch (error) {
    console.error('Error fetching badges:', error)
    throw error
  }
}

// Example return format:
/*
{
  "instructor_id": "instructor-uuid",
  "badges": [
    {
      "badge": "Formador de Turmas",
      "progress": 42,
      "level": "Sênior",
      "nextGoal": 50,
      "percentage": 84
    },
    {
      "badge": "Mentor de Alunos",
      "progress": 150,
      "level": "Pleno",
      "nextGoal": 250,
      "percentage": 50
    },
    {
      "badge": "Facilitador de Jogos",
      "progress": 8,
      "level": "Júnior",
      "nextGoal": 15,
      "percentage": 30
    },
    {
      "badge": "Organizador de Eventos",
      "progress": 2,
      "level": null,
      "nextGoal": 3,
      "percentage": 67
    }
  ]
}
*/