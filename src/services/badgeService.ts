import { supabase } from '../lib/supabase'
import { InstructorStats, BadgeResult, InstructorStatsRow } from '../types/badges'
import { BADGE_CONFIGS, calculateBadgeProgress } from '../utils/badgeUtils'

export class BadgeService {
  
  async getInstructorStats(instructorId: string): Promise<InstructorStats> {
    // Get instructor stats from instructor_stats table if it exists
    const { data: statsData, error: statsError } = await supabase
      .from('instructor_stats')
      .select('*')
      .eq('instructor_id', instructorId)
      .single()

    if (!statsError && statsData) {
      return {
        instructor_id: instructorId,
        classes: statsData.classes || 0,
        students: statsData.students || 0,
        matches: statsData.matches || 0,
        events: statsData.events || 0
      }
    }

    // If no stats table exists, calculate from base tables
    return await this.calculateStatsFromTables(instructorId)
  }

  private async calculateStatsFromTables(instructorId: string): Promise<InstructorStats> {
    const [classesCount, studentsCount, matchesCount, eventsCount] = await Promise.all([
      this.getClassesCount(instructorId),
      this.getStudentsCount(instructorId),
      this.getMatchesCount(instructorId),
      this.getEventsCount(instructorId)
    ])

    return {
      instructor_id: instructorId,
      classes: classesCount,
      students: studentsCount,
      matches: matchesCount,
      events: eventsCount
    }
  }

  private async getClassesCount(instructorId: string): Promise<number> {
    const { count, error } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', instructorId)

    if (error) {
      console.error('Error counting classes:', error)
      return 0
    }

    return count || 0
  }

  private async getStudentsCount(instructorId: string): Promise<number> {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        class_players (
          player_id
        )
      `)
      .eq('instructor_id', instructorId)

    if (error) {
      console.error('Error counting students:', error)
      return 0
    }

    const uniqueStudents = new Set()
    data?.forEach(classItem => {
      classItem.class_players?.forEach((cp: any) => {
        if (cp.player_id) {
          uniqueStudents.add(cp.player_id)
        }
      })
    })

    return uniqueStudents.size
  }

  private async getMatchesCount(instructorId: string): Promise<number> {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        matches (
          id
        )
      `)
      .eq('instructor_id', instructorId)

    if (error) {
      console.error('Error counting matches:', error)
      return 0
    }

    let totalMatches = 0
    data?.forEach(classItem => {
      totalMatches += classItem.matches?.length || 0
    })

    return totalMatches
  }

  private async getEventsCount(instructorId: string): Promise<number> {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', instructorId)

    if (error) {
      console.error('Error counting events:', error)
      return 0
    }

    return count || 0
  }

  async getInstructorBadges(instructorId: string): Promise<BadgeResult> {
    const stats = await this.getInstructorStats(instructorId)
    
    const badges = BADGE_CONFIGS.map(config => 
      calculateBadgeProgress(stats, config)
    )

    return {
      instructor_id: instructorId,
      badges
    }
  }

  async updateInstructorStats(instructorId: string): Promise<InstructorStats> {
    const stats = await this.calculateStatsFromTables(instructorId)
    
    // Try to upsert into instructor_stats table if it exists
    const { error } = await supabase
      .from('instructor_stats')
      .upsert({
        instructor_id: instructorId,
        classes: stats.classes,
        students: stats.students,
        matches: stats.matches,
        events: stats.events,
        updated_at: new Date().toISOString()
      })

    if (error && !error.message.includes('relation "instructor_stats" does not exist')) {
      console.error('Error updating instructor stats:', error)
    }

    return stats
  }
}