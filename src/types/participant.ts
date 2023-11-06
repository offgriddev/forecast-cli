export type ParticipantCardAssignment = {
  workable: number
  overage: number
}

export type ParticipantWeekEstimate = {
  hours: number
  days: number
  participant: string
  key: string
  estimate: number
  startDate: Date
  endDate: Date
}

export type Estimate = {
  totalComplexity: number
  totalWeeks: number
  weeks: ParticipantWeekEstimate[][]
}

export type Metric = {
  source: string
  complexity: number
}

export type ProjectTaskData = {
  Complexity: string
  EpicLink: string
  Key: string
  total: number
  fact: number
}

export type SizeAnalytics = {
  avg: number
  wip?: number
  min?: number
  max?: number
}

export type ParticipantStatistics = {
  '0': SizeAnalytics
  '1': SizeAnalytics
  '2': SizeAnalytics
  '3': SizeAnalytics
  '4': SizeAnalytics
  '5': SizeAnalytics
} & Record<string, SizeAnalytics>

export type Participant = {
  name: string
  workableHours: number
  stats: ParticipantStatistics
  weeks: ParticipantWeekEstimate[][]
  daysUnavailable: UnavailabilityRange[]
}
export type ParticipantAvailability = [Participant?, ParticipantCardAssignment?]

export type PersonaAnalytics = {
  jiraKey: string
  commit: string
  author: string
  startDate: string
  endDate: string
  estimate: number
  actual: number
  duration: number
}

export type UnavailabilityRange = {
  from: Date
  to: Date
}

export type ParticipantsConfig = {
  /**
   * Total amount of workable hours in the week, 120 is default
   */
  workableHours: number

  /**
   * list of all participants GitHub usernames involves in the project
   */
  username: string

  /**
   * specific times during effort participant is expected to be away
   * restricts start date and affects participant velocity
   */
  daysUnavailable: UnavailabilityRange[]
}
