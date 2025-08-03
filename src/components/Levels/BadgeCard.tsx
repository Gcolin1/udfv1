export type Badge = {
  id: string
  title: string
  current: number
  stages: number[]
  unit: string
}

const badgeStages = ['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Expert']

export function BadgeCard({ badge }: { badge: Badge }) {
  const { current, stages, title, unit } = badge

  const currentStageIndex = stages.findIndex(stage => current < stage)
  const currentStage =
    currentStageIndex === -1 ? 5 : currentStageIndex === 0 ? 1 : currentStageIndex

  const maxValue = stages[currentStage - 1] || stages[0]
  const progress = Math.min(100, Math.round((current / maxValue) * 100))
  const stageLabel = badgeStages[currentStage - 1] || badgeStages[0]

  return (
    <div className="border border-gray-200 bg-white rounded-xl p-4 shadow-sm flex flex-col gap-2">
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-600">Estágio: <strong>{stageLabel}</strong></p>
      <p className="text-sm text-gray-600">{`${current} / ${maxValue} ${unit}`}</p>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}