import groupBy from 'lodash.groupby'
import {
  CodeMetrics,
  ParticipantWeekEstimate,
  ParticipantAvailability,
  JiraIssueChangelog,
  PersonaAnalytics,
  Participant,
  ParticipantsConfig,
  JiraIssue
} from '../types'
import {getRealisticDuration} from './dates'
import {findCard, findChangeLog, findChangelogForKey} from './helpers'
import {getJiraIssueKeyFromReport} from './commits'

function NewParticipant(participant: ParticipantsConfig): Participant {
  return {
    name: participant.username,
    workableHours: participant.workableHours,
    stats: {
      '0': {
        avg: 3
      },
      '1': {
        avg: 3.74
      },
      '2': {
        avg: 5
      },
      '3': {
        avg: 6.5
      },
      '4': {
        avg: 7.5
      },
      '5': {
        avg: 8
      }
    },
    daysUnavailable: participant.daysUnavailable,
    weeks: []
  }
}
export async function calculateRateOfDeliveryStatisticsByParticipant(
  participantConfigs: ParticipantsConfig[],
  commits: CodeMetrics[],
  cards: JiraIssue[],
  changelogs: JiraIssueChangelog[],
  logIndicators: string[]
): Promise<Participant[]> {
  const productionMerges = commits.filter(
    metric =>
      new Date(metric.dateUtc) > new Date('2023-04-30T01:10:49.975Z') &&
      metric.ref === 'refs/heads/main'
  )

  const participantProductionDeploys = groupBy(productionMerges, 'actor')
  const participantStatistics = []

  for (const participantConfig of participantConfigs) {
    const actorHistory =
      participantProductionDeploys[participantConfig.username]

    if (!actorHistory) {
      participantStatistics.push(NewParticipant(participantConfig))
      continue
    }

    const actorResults: PersonaAnalytics[] = []

    for (const report of participantProductionDeploys[
      participantConfig.username
    ]) {
      const jiraIssueKey = getJiraIssueKeyFromReport(report)
      const card = findCard(jiraIssueKey, cards)
      if (!card) {
        continue
      }
      const changelog = findChangelogForKey(jiraIssueKey, changelogs)
      if (!changelog) {
        continue
      }

      // determining the start date is tricky
      // is it when it was first moved into the "In Development" column?
      // is it when the actual dev moves it there? the project manager / manager?
      // we could get all the times it was moved into the InDev column and pull
      // an average? the median?

      // when the assigned developer moves it into "In Development", then we start the clock
      // if it's moved back, we do not stop the clock.
      // when it's moved back, we take the average of the distance

      const {created: startDate} = findChangeLog(
        changelog.values,
        logIndicators
      ) // needs to be options

      // get previous push to main and compare complexity
      const repoMerges = productionMerges.filter(
        commit => commit.repository.repo === report.repository.repo
      )
      const shaIndex = repoMerges.findIndex(commit => commit.sha === report.sha)

      const commit = repoMerges[shaIndex + 1]
      const result = {
        jiraKey: jiraIssueKey,
        commit: report.sha,
        author: report.actor,
        startDate,
        endDate: report.dateUtc,
        estimate: +card.estimate,
        actual: commit ? report.totalComplexity - commit.totalComplexity : 1,
        duration: getRealisticDuration(startDate, report.dateUtc)
      }
      actorResults.push(result)
    }
    const groupedByActual = groupBy(actorResults, 'actual')
    const actualSizes = Object.keys(groupedByActual)
    const participant: Participant = NewParticipant(participantConfig)
    for (const size of actualSizes) {
      const avg =
        groupedByActual[size]
          .map(({duration}) => duration)
          .reduce((prev, cur) => prev + cur) / groupedByActual[size].length

      participant.stats[size] = {avg}
    }
    participantStatistics.push(participant)
  }
  return participantStatistics
}

/**
 * Returns a player with time remaining for the week
 * if returns undefined, then it's time to work through next week
 * @param {[]Object} players
 * @param {number} currentWeek
 */
export function getParticipantPersonaAvailability(
  participants: Participant[],
  currentWeek: number,
  currentCard: JiraIssue
): ParticipantAvailability {
  const participantsCopy = [...participants]
  while (participantsCopy.length > 0) {
    // select a random index of participants
    const index = Math.floor(Math.random() * participantsCopy.length)
    const participant = participantsCopy[index]
    const participantWeek = participant.weeks[currentWeek] || []

    // get hours worked for week based on card complexity
    // if participant weekly total + complexity hours > 120, remove from list
    // if participant weekly total + complexity hours < 120, then return player
    // if no players available, return undefined

    // not sure if this will throw it off
    const participantWeeklyTotal = participantWeek.reduce(
      (prev, {hours}) => +hours + +prev,
      0
    )

    // get the amount over for the week
    // calculate in working hours (24/8). If less than 50% of the day
    // is remaining on an overage, don't take a new card.
    // If the current card has more than 60 % of the task over
    // the weekly limit, then carry over a reasonable amount of the work
    // to the following week

    const hours = +participant.stats[currentCard.estimate].avg * 8 // calculations are taken in days, mult by 8 for workday

    // what if it's empty?
    const isGreaterThanAvailable =
      +participantWeeklyTotal + hours > participant.workableHours
    const overage = isGreaterThanAvailable
      ? Math.abs(participant.workableHours - (+participantWeeklyTotal + hours))
      : 0
    const workable = hours - overage

    // is it worth picking up? or should I focus on that certification
    const timeLeftInDay = 0.4 // percentage
    const worthPickingUp = workable / 24 > timeLeftInDay // it's worth picking up if the amount of hours left is greater than 50% of an average day

    // calculate with days unavailable here
    // const datesForCard = calculateDates(
    //   startDate,
    //   participant,
    //   currentWeek,
    //   participant.stats[currentCard.estimate].avg
    // )
    // if start date falls within a days-off range,
    // mark isAvailable = false
    const isAvailable = true
    if (worthPickingUp && isAvailable) {
      return [participant, {workable, overage}]
    } else {
      participantsCopy.splice(index, 1)
    }
  }
  return [undefined, undefined]
}
export function getParticipantWeeks(
  participants: Participant[]
): ParticipantWeekEstimate[][] {
  const weeks: ParticipantWeekEstimate[][] = []
  const participantCopy = [...participants]
  while (participantCopy.length > 0) {
    const participant = participantCopy[0]
    // add each players totals for a week
    for (let w = 0; w < participant.weeks.length; w++) {
      const givenWeek = weeks[w] || []
      const participantWeek = participant.weeks[w]
      const combinedWeek = givenWeek.concat(participantWeek)
      weeks[w] = combinedWeek
    }
    participantCopy.splice(0, 1)
  }
  return weeks
}
