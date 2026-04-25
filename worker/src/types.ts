export interface Jotting {
  id: string
  text: string
  mediaUrl?: string
  mediaType?: string
  timestamp: string
}

export interface ActivityRow {
  type: string
  details: string
  include: boolean
}

export interface LanguageRow {
  skill: string
  context: string
  include: boolean
}

export interface ObjectiveConnection {
  objectiveKey: string
  objectiveLabel: string
  connection: string
}

export interface Photo {
  url: string
  caption: string
}

export interface JournalSections {
  activities: ActivityRow[]
  techInsights: string
  culturalObservations: string
  languageApplications: LanguageRow[]
  objectiveConnections: ObjectiveConnection[]
  positiveReflections: string
  questionsCuriosities: string
  photos: Photo[]
  tomorrowsAnticipation: string
}

export type DayStatus = 'jotting' | 'reviewing' | 'approved' | 'exported'

export interface DayEntry {
  day: number
  date: string
  city: string
  status: DayStatus
  jottings: Jotting[]
  sections?: JournalSections
  draftGeneratedAt?: string
  exportedAt?: string
}

export interface VoiceProfile {
  description: string
  sample: string
  rules: string[]
}
