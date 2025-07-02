// src/pages/CreateEventPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Calendar, Users, Clock, BookOpen } from 'lucide-react'
import { CreateEventModal } from '../components/modal/CreateEventModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface EventFormData {
  name: string
  description: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_limit: number
  max_players: number
  instructions: string
}

export function CreateEventPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditing = !!editId

  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [eventCode, setEventCode] = useState('')
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    subject: '',
    difficulty: 'medium',
    time_limit: 30,
    max_players: 50,
    instructions: ''
  })

  useEffect(() => {
    if (isEditing && editId) {
      loadEventForEdit(editId)
    }
  }, [isEditing, editId])

  const loadEventForEdit = async (eventId: string) => {
    try {
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('instructor_id', user?.id)
        .single()

      if (error) {
        console.error('Error loading event:', error)
        toast.error('Erro ao carregar evento para edição')
        navigate('/my-events')
        return
      }

      setFormData({
        name: eventData.name || '',
        description: eventData.description || '',
        subject: eventData.subject || '',
        difficulty: eventData.difficulty || 'medium',
        time_limit: eventData.time_limit || 30,
        max_players: eventData.max_players || 50,
        instructions: eventData.instructions || ''
      })
    } catch (error) {
      console.error('Error loading event for edit:', error)
      toast.error('Erro ao carregar evento para edição')
      navigate('/my-events')
    }
  }

  const generateEventCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      if (isEditing && editId) {
        const { error } = await supabase
          .from('events')
          .update({
            name: formData.name,
            description: formData.description,
            subject: formData.subject,
            difficulty: formData.difficulty,
            time_limit: formData.time_limit,
            max_players: formData.max_players,
            instructions: formData.instructions,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId)
          .eq('instructor_id', user.id)

        if (error) throw error

        toast.success('Evento atualizado com sucesso!')
        navigate('/my-events')
      } else {
        const codigo = generateEventCode()

        const { error } = await supabase
          .from('events')
          .insert({
            name: formData.name,
            code: codigo,
            description: formData.description,
            subject: formData.subject,
            difficulty: formData.difficulty,
            time_limit: formData.time_limit,
            max_players: formData.max_players,
            instructions: formData.instructions,
            instructor_id: user.id
          })

        if (error) throw error

        setEventCode(codigo)
        setModalOpen(true)
      }
    } catch (error) {
      console.error('Error saving event:', error)
      toast.error(isEditing ? 'Erro ao atualizar evento' : 'Erro ao criar evento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof EventFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/my-events')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? 'Editar Evento' : 'Criar Novo Evento'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing
              ? 'Atualize as informações do seu evento educacional'
              : 'Configure um novo evento educacional para suas turmas'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Informações Básicas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Evento *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Matemática Básica - 6º Ano"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matéria
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Matemática, Português, História"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o objetivo e conteúdo do evento..."
                />
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Configurações
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dificuldade
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      handleInputChange('difficulty', e.target.value as 'easy' | 'medium' | 'hard')
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Tempo Limite (min)
                  </label>
                  <input
                    type="number"
                    value={formData.time_limit}
                    onChange={(e) => handleInputChange('time_limit', parseInt(e.target.value))}
                    min="5"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Máx. Jogadores
                  </label>
                  <input
                    type="number"
                    value={formData.max_players}
                    onChange={(e) => handleInputChange('max_players', parseInt(e.target.value))}
                    min="1"
                    max="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Instruções */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Instruções para os Jogadores
              </h2>

              <div>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Instruções detalhadas sobre como participar do evento, regras do jogo, objetivos de aprendizado..."
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/my-events')}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isEditing ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Atualizar Evento' : 'Criar Evento'}
                  </>
                )}
              </button>
            </div>
          </form>

          {!isEditing && (
            <CreateEventModal
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false)
                navigate('/my-events')
              }}
              eventCode={eventCode}
            />
          )}
        </div>
      </div>
    </div>
  )
}
