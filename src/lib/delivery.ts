import {addDays, addWeeks} from 'date-fns'
import {
  CodeMetrics,
  DeliveryProjectionConfig,
  EstimateResults,
  JiraIssue,
  JiraIssueChangelog,
  Participant
} from '../types'
import {structureRepositoryCommits} from './commits'
import {forecastProjectDelivery} from './estimate'
import {
  retrieveJiraEpicIssues,
  retrieveJiraIssueChangelogs,
  retrieveOutstandingJiraEpicIssues
} from './jira'
import {parseFromString} from 'date-fns-timezone'
import {calculateRateOfDeliveryStatisticsByParticipant} from './participants'
import {getEndDate} from './dates'
import groupBy from 'lodash.groupby'

export function printResults(
  result: EstimateResults,
  config: DeliveryProjectionConfig
): void {
  const endDate = getEndDate(result)
  const metadata = {
    complexity: result.estimate.totalComplexity,
    weeks: result.estimate.totalWeeks,
    startDate: new Date(config.startDate),
    endDate
  }
  console.log()
  console.log('Project Delivery Overview')
  console.table([metadata])

  console.log()
  for (let w = 0; w < result.estimate.weeks.length; w++) {
    const week = result.estimate.weeks[w]
    const weekStart = addWeeks(Date.parse(config.startDate), w)
    const weekEnd = addDays(weekStart, 4)
    console.log(
      `Week ${w + 1}: ${weekStart.toUTCString()} to ${weekEnd.toUTCString()}`
    )
    console.table(week)
  }

  console.log()
  console.log('Determining Probability')
  console.table(result.probability)
}
export async function calculateDelivery(
  config: DeliveryProjectionConfig
): Promise<EstimateResults> {
  const jiraEpicIssues = (await retrieveJiraEpicIssues(config.jira)).issues.map(
    issue => ({
      ...issue,
      estimate: +issue.fields[config.jira.fields[0].from]
    })
  )
  const {messages, issueChangeLogs, repositoryCommits} =
    await generateEstimateBaselineData(config, jiraEpicIssues)
  const participants = await calculateRateOfDeliveryStatisticsByParticipant(
    config.participants,
    repositoryCommits,
    jiraEpicIssues,
    issueChangeLogs,
    config.jira.startSignal
  )
  // iterate n times to get statistical probabilty of time
  // based on a random distribution
  const estimate = await forecastProjectDelivery(
    jiraEpicIssues,
    participants,
    parseFromString(config.startDate, 'YYYY-MM-DD')
  )
  const probability = await forecastProbability(
    jiraEpicIssues,
    participants,
    new Date(config.startDate),
    config.iterations
  )
  return {
    messages,
    estimate,
    probability
  }
}

async function forecastProbability(
  jiraEpicIssues: JiraIssue[],
  participants: Participant[],
  startDate: Date,
  iterations: number
): Promise<Record<string, {avg: number}>> {
  const estimates = []
  for (let i = 0; i < iterations; i++) {
    const participantCopy = [...participants]
    const cardsCopy = [...jiraEpicIssues]
    const estimate = await forecastProjectDelivery(
      cardsCopy,
      participantCopy,
      new Date(startDate)
    )
    estimates.push({
      weeks: estimate.weeks.length,
      endDate: getEndDate({estimate})
    })
  }
  const results: Record<string, {avg: number}> = {}
  const groupedByWeek = groupBy(estimates, 'weeks')
  for (const weeks in groupedByWeek) {
    const dates = groupedByWeek[weeks]
    results[weeks] = {
      avg: dates.length / estimates.length
    }
  }
  return results
}

export async function calculateDeliveryTimeRemaining(
  config: DeliveryProjectionConfig
): Promise<EstimateResults> {
  const jiraEpicIssues = (
    await retrieveOutstandingJiraEpicIssues(config.jira)
  ).issues.map(issue => ({
    ...issue,
    estimate: +issue.fields[config.jira.fields[0].from]
  }))
  const {messages, issueChangeLogs, repositoryCommits} =
    await generateEstimateBaselineData(config, jiraEpicIssues)
  
  const participants = await calculateRateOfDeliveryStatisticsByParticipant(
    config.participants,
    repositoryCommits,
    jiraEpicIssues,
    issueChangeLogs,
    config.jira.startSignal
  )

  // const probability = await forecastProbability(
  //   jiraEpicIssues,
  //   participants,
  //   new Date(config.startDate),
  //   config.iterations
  // )

  // iterate n times to get statistical probabilty of time
  // based on a random distribution
  const estimate = await forecastProjectDelivery(
    jiraEpicIssues,
    participants,
    new Date(config.startDate)
  )
  return {
    messages,
    estimate
  }
}

async function generateEstimateBaselineData(
  config: DeliveryProjectionConfig,
  jiraEpicIssues: JiraIssue[]
): Promise<{
  issueChangeLogs: JiraIssueChangelog[]
  jiraEpicIssues: JiraIssue[]
  messages: string[]
  repositoryCommits: CodeMetrics[]
}> {
  const repositoryCommits = await structureRepositoryCommits(
    config.repositories
  )
  const messages = []
  messages.push(`${repositoryCommits.length} repository commits found.`)

  const issueChangeLogs = await retrieveJiraIssueChangelogs(
    jiraEpicIssues.map(issue => issue.key),
    config.jira
  )
  messages.push(`${issueChangeLogs.length} Jira issue Changelogs found.`)

  return {
    issueChangeLogs,
    jiraEpicIssues,
    messages,
    repositoryCommits
  }
}
