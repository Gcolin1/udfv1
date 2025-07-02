// src/components/ClassDetails/ClassScheduleCalendar.tsx
import { CalendarDays, ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react'
import { format, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ScheduledDateInfo {
  date: Date
  initialTime: string
  endTime: string
  description: string
  index: number
}

interface ClassScheduleCalendarProps {
  scheduledDatesMap: Map<string, ScheduledDateInfo>
  currentMonth: Date
  setCurrentMonth: (month: Date) => void
  onShowTooltip: (info: ScheduledDateInfo | null, rect: DOMRect | null) => void
}

export function ClassScheduleCalendar({ 
  scheduledDatesMap, 
  currentMonth, 
  setCurrentMonth,
  onShowTooltip
}: ClassScheduleCalendarProps) {
  const endOfCurrentMonth = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: currentMonth, end: endOfCurrentMonth })
  const startingDayIndex = getDay(currentMonth)

  // ✅ Correção: garantindo tipagem unificada (Date | null)
  const calendarDays: (Date | null)[] = [
    ...Array.from({ length: startingDayIndex }, () => null),
    ...daysInMonth
  ]

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const totalScheduledEvents = scheduledDatesMap.size

  const handleMouseEnter = (scheduledInfo: ScheduledDateInfo, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onShowTooltip(scheduledInfo, rect)
  }

  const handleMouseLeave = () => {
    onShowTooltip(null, null)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-blue-600" />
        Cronograma da Turma
      </h2>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        {/* Header do Calendário com Navegação */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <h3 className="text-lg font-semibold text-gray-800">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {/* Dias da Semana */}
          <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600 mb-2 min-w-full">
            {weekdays.map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          {/* Dias do Mês */}
          <div className="grid grid-cols-7 gap-2 min-w-full">
            {calendarDays.map((day, index) => {
              const isScheduled = day && scheduledDatesMap.has(format(day, 'yyyy-MM-dd'))
              const scheduledInfo = isScheduled ? scheduledDatesMap.get(format(day, 'yyyy-MM-dd')) : null

              return (
                <div
                  key={index}
                  className={`relative flex items-center justify-center w-full aspect-square rounded-md transition-all duration-200 cursor-pointer
                    ${day ? 'bg-white text-gray-800' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}
                    ${isScheduled ? 'bg-blue-500 text-white font-semibold shadow-md hover:scale-105' : 'hover:bg-gray-100'}
                  `}
                  onMouseEnter={isScheduled && scheduledInfo ? (e) => handleMouseEnter(scheduledInfo, e) : undefined}
                  onMouseLeave={isScheduled ? handleMouseLeave : undefined}
                >
                  {day ? format(day, 'd') : ''}
                  {isScheduled && (
                    <CalendarCheck className="absolute bottom-1 right-1 w-4 h-4 text-green-200" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Resumo */}
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            📅 Total de {totalScheduledEvents} encontro{totalScheduledEvents > 1 ? 's' : ''} programado{totalScheduledEvents > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
