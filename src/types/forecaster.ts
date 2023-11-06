import {JiraConfig} from './jira'
import {Estimate, ParticipantsConfig} from './participant'

/**
 * Estimate project is the config related to estimating a project with complexity
 * as the basis.
 */
export type DeliveryProjectionConfig = {
  /**
   * auth and other details for talking to Jira
   */
  jira: JiraConfig
  /**
   * config for participant involvement in the project
   */
  participants: ParticipantsConfig[]
  /**
   * repositories involved in project
   */
  repositories: string[]
  /**
   * anonymizes developer identity during velocity calculation
   */
  anonymizeParticipants: boolean
  /**
   * start date for initiative
   */
  startDate: string
  /**
   * number of times to sample the team and project dynamics
   */
  iterations: number
}

export type EstimateResults = {
  messages?: string[]
  estimate: Estimate
  probability?: Record<
    string,
    {
      avg: number
    }
  >
}
