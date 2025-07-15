import { Class } from '../types'

export function getClassStatus(startDate: string | null, endDate: string | null): {
  color: string
  label: string
} {
  if (!startDate || !endDate) {
    return {
      color: 'bg-gray-100 text-gray-800',
      label: 'Indefinido'
    }
  }

  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) {
    return {
      color: 'bg-blue-100 text-blue-800',
      label: 'Agendada'
    }
  }
  
  if (now > end) {
    return {
      color: 'bg-red-100 text-red-800',
      label: 'Finalizada'
    }
  }
  
  return {
    color: 'bg-green-100 text-green-800',
    label: 'Ativa'
  }
}

export function isClassActive(classData: Class): boolean {
  if (!classData.start_date || !classData.end_date) return false
  
  const now = new Date()
  const start = new Date(classData.start_date)
  const end = new Date(classData.end_date)
  
  return now >= start && now <= end
}

export function getClassDuration(classData: Class): number | null {
  if (!classData.start_date || !classData.end_date) return null
  
  const start = new Date(classData.start_date)
  const end = new Date(classData.end_date)
  
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function hasValidSchedule(classData: Class): boolean {
  return !!(
    classData.schedule && 
    Array.isArray(classData.schedule) && 
    classData.schedule.length > 0 &&
    classData.schedule.every(meeting => 
      meeting &&
      meeting['initial-time'] &&
      typeof meeting['initial-time'] === 'string' &&
      meeting['initial-time'].trim() !== '' &&
      meeting['end-time'] &&
      typeof meeting['end-time'] === 'string' &&
      meeting['end-time'].trim() !== ''
    )
  )
}

export function getNextScheduledMeeting(classData: Class): Date | null {
  if (!hasValidSchedule(classData)) return null
  
  const now = new Date()
  const meetings = classData.schedule!
    .map(meeting => {
      try {
        return new Date(meeting['initial-time'])
      } catch {
        return null
      }
    })
    .filter(date => date !== null && date > now)
    .sort((a, b) => a!.getTime() - b!.getTime())
  
  return meetings.length > 0 ? meetings[0] : null
}

export function getTotalScheduledMeetings(classData: Class): number {
  if (!hasValidSchedule(classData)) return 0
  return classData.schedule!.length
}

export function getCompletedMeetings(classData: Class): number {
  if (!hasValidSchedule(classData)) return 0
  
  const now = new Date()
  return classData.schedule!
    .map(meeting => {
      try {
        return new Date(meeting['end-time'])
      } catch {
        return null
      }
    })
    .filter(date => date !== null && date < now)
    .length
}

export function getClassProgress(classData: Class): number {
  const total = getTotalScheduledMeetings(classData)
  if (total === 0) return 0
  
  const completed = getCompletedMeetings(classData)
  return Math.round((completed / total) * 100)
}