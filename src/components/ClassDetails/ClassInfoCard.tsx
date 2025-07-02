// src/components/ClassDetails/ClassInfoCard.tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Class {
  id: string
  code: string
  description: string | null
  instructor_id: string | null
  influencer_id: string | null
  event_id: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  event_type: 'training' | 'course'
  schedule: Array<{ 'initial-time': string; 'end-time': string }> | null
  event?: {
    name: string
    subject: string
    difficulty: string
  }
  influencer?: {
    name: string
    email: string
  }
}

interface ClassInfoCardProps {
  classData: Class
  getEventTypeLabel: (eventType: string) => string
  getStatusColor: (startDate: string | null, endDate: string | null) => string
  getStatusLabel: (startDate: string | null, endDate: string | null) => string
}

export function ClassInfoCard({ 
  classData, 
  getEventTypeLabel, 
  getStatusColor, 
  getStatusLabel
}: ClassInfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalhes da Turma</h2>
      
      <div className="space-y-4">
        {/* Event Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Tipo de Evento:</span>
          <span className="text-sm text-gray-600 capitalize">{getEventTypeLabel(classData.event_type)}</span>
        </div>

        {/* Status */}
        {(classData.start_date || classData.end_date) && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(classData.start_date, classData.end_date)}`}>
              {getStatusLabel(classData.start_date, classData.end_date)}
            </span>
          </div>
        )}
        
        {/* Start Date */}
        {classData.start_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Data de Início:</span>
            <span className="text-sm text-gray-600">
              {format(new Date(classData.start_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </span>
          </div>
        )}
        
        {/* End Date */}
        {classData.end_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Data de Fim:</span>
            <span className="text-sm text-gray-600">
              {format(new Date(classData.end_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </span>
          </div>
        )}
        
        {/* Created Date */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Criada em:</span>
          <span className="text-sm text-gray-600">
            {format(new Date(classData.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  )
}
