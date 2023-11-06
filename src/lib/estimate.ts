import {addWeeks} from 'date-fns'
import {
  Estimate,
  JiraIssue,
  Participant,
  ParticipantWeekEstimate
} from '../types'
import {
  getParticipantPersonaAvailability,
  getParticipantWeeks
} from './participants'
import {calculateDates} from './dates'

/**
 * addOverages calculates leftover amount from week before to account
 * for carry over from week to week
 */
const addOverages = (
  participant: Participant,
  currentWeek: number,
  overage: number,
  card: JiraIssue,
  hoursPerWeek: number,
  startDate: Date
): void => {
  if (overage > 0) {
    // overages get pushed into next week
    const leftoverAmount = overage - hoursPerWeek

    participant.weeks[+currentWeek + 1] =
      participant.weeks[+currentWeek + 1] || []
    const remainingHours =
      leftoverAmount < 0 ? hoursPerWeek + leftoverAmount : hoursPerWeek
    const days = Math.round((remainingHours * 100) / 8) / 100
    const dates = calculateDates(
      addWeeks(startDate, 1),
      participant,
      currentWeek + 1,
      days
    )
    participant.weeks[+currentWeek + 1].push({
      key: card.key,
      estimate: card.estimate,
      participant: participant.name,
      hours: Math.round(remainingHours * 100) / 100,
      days,
      ...dates
    })
    if (leftoverAmount > 0) {
      addOverages(
        participant,
        currentWeek + 1,
        leftoverAmount,
        card,
        hoursPerWeek,
        addWeeks(startDate, 1)
      )
    }
  }
}

export async function forecastProjectDelivery(
  cards: JiraIssue[],
  participants: Participant[],
  startDate: Date
): Promise<Estimate> {
  let currentWeek = 0
  const totalComplexity = getProjectComplexity(cards)
  // get week and remaining days for start date
  // start date is start date for week 1
  // participant assignment to a card calculates start and end dates for the week worked.
  while (cards.length > 0) {
    const cardIndex = Math.floor(Math.random() * cards.length)
    const card = cards[cardIndex]

    // participant selection
    const [participant, availability] = getParticipantPersonaAvailability(
      participants,
      currentWeek,
      card
    )

    if (!participant) {
      // If no participant is free to pick up a card
      // the week is over
      currentWeek++
    } else {
      const {workable, overage} = availability!
      participant.weeks[currentWeek] = participant.weeks[currentWeek] || []

      // determining start date requires knowing
      // days of the week
      // how much a participant has worked so far that week
      const weekStartDate = addWeeks(startDate, currentWeek)
      // endDate would be the enddate for working during the week
      const days = Math.round((workable * 100) / 8) / 100
      const dates = calculateDates(
        weekStartDate,
        participant,
        currentWeek,
        days
      )
      participant.weeks[currentWeek].push({
        key: card.key,
        estimate: card.estimate,
        participant: participant.name,
        hours: Math.round(workable * 100) / 100,
        days,
        ...dates
      })

      // do this recursively
      addOverages(
        participant,
        currentWeek,
        overage,
        card,
        participant.workableHours,
        weekStartDate
      )
      cards.splice(cardIndex, 1)
    }
  }

  const weeks = sortWeeks(getParticipantWeeks(participants))

  return {totalComplexity, totalWeeks: weeks.length, weeks}
}

function sortWeeks(
  participantWeeks: ParticipantWeekEstimate[][]
): ParticipantWeekEstimate[][] {
  for (let i = 0; i < participantWeeks.length; i++) {
    participantWeeks[i] = participantWeeks[i]
      .sort((a, b) =>
        a.startDate === b.startDate ? 0 : a.startDate > b.startDate ? 1 : -1
      )
      .sort((a, b) =>
        a.endDate === b.endDate ? 0 : a.endDate > b.endDate ? 1 : -1
      )
  }
  return participantWeeks
}
function getProjectComplexity(cards: JiraIssue[]): number {
  return cards.reduce((prev, cur) => +cur.estimate + prev, 0)
}
