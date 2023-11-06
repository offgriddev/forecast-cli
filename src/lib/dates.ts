import {addDays, differenceInHours} from 'date-fns'
import {EstimateResults, Participant} from '../types'
function getNonWorkableHours(startDate: Date, endDate: Date): number {
  let numOfWorkableHours = 0
  for (let d = startDate; d < endDate; d = addDays(d, 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) numOfWorkableHours++
  }
  return numOfWorkableHours * 24
}

export function getRealisticDuration(
  startDateStr: string,
  endDateStr: string
): number {
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)

  const durationInHours = differenceInHours(endDate, startDate)
  const nonWorkableHours = getNonWorkableHours(startDate, endDate)
  // add days off to nonWorkableHours
  const workableHours = durationInHours - nonWorkableHours
  return Math.round((workableHours / 24.0) * 100) / 100
}

export function calculateDates(
  startDate: Date,
  participant: Participant,
  currentWeek: number,
  days: number
): {startDate: Date; endDate: Date} {
  const daysAlreadyPlanned = participant.weeks[currentWeek].reduce(
    (prev, cur) => {
      // cardded work because it's hours already attached to card
      return prev + cur.days
    },
    0
  )
  // does the end date fall within an available
  return {
    startDate: addDays(startDate, daysAlreadyPlanned),
    endDate: addDays(startDate, daysAlreadyPlanned + days)
  }
}

export function getEndDate(result: EstimateResults): Date {
  const lastIndex = result.estimate.weeks.length - 1
  const lastWeek = result.estimate.weeks[lastIndex]
  const lastWorkLog = lastWeek[lastWeek.length - 1]
  return lastWorkLog.endDate
}
