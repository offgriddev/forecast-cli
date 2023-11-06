import fs from 'fs/promises'
import {Command} from 'commander'
import {ChangeLogItem, CodeMetrics} from '../types'
import {getIssue, getIssueChangelog} from '../lib/jira'
import {getCommitMetrics} from '../lib/fs'
import {getRealisticDuration} from '../lib/dates'

type StatsParams = {
  sha: string
  jiraUsername: string
  jiraPassword: string
  jiraHost: string
  estimateField: string
}
function findChangeLog(values: ChangeLogItem[], id: string): ChangeLogItem {
  const ids = id.split(',')
  for (const log of values) {
    const found = log.items.find((item: {to: string}) => ids.includes(item.to))
    if (found) return log
  }
  return {} as ChangeLogItem
}
export const getDeveloperStatisticsBySha = new Command()
  .name('sha-get')
  .alias('sg')
  .option(
    '-S, --sha <sha>',
    'Git SHA to use as the basis for analysis test case.'
  )
  .option('-U, --jira-username <username>', 'Username for JIRA')
  .option('-P, --jira-password <password>', 'Password for JIRA')
  .option('-H, --jira-host <host>', 'Host for Jira account')
  .option(
    '-E, --estimate-field <field>',
    'Custom field where estimate is stored on model'
  )
  .action(async (options: StatsParams) => {
    const data = await fs.readFile(
      `data/commit-metrics/${options.sha}.json`,
      'utf-8'
    )
    const metrics: CodeMetrics = JSON.parse(data)

    // if the commit is a merge into main, head will be undefined
    const isMainMerge = metrics.ref === 'refs/heads/main'

    if (!isMainMerge) {
      console.log(
        `SHA ${options.sha} is not for a merge into main. Can only calculate delivery on a final merge into main.`
      )
      return
    }

    const jiraIssueKey = metrics.head.split('/')[1].replace('_', '-')
    const issueP = getIssue(jiraIssueKey, {
      username: options.jiraUsername,
      password: options.jiraPassword,
      host: options.jiraHost
    })
    const changelogP = getIssueChangelog(jiraIssueKey, {
      username: options.jiraUsername,
      password: options.jiraPassword,
      host: options.jiraHost
    })

    const [issue, changelog] = await Promise.all([issueP, changelogP])
    const estimate = issue.fields[options.estimateField]
    const {created: startDate} = findChangeLog(changelog.values, '3,10071') // needs to be options
    // get previous push to main and compare complexity
    const commits = await getCommitMetrics()
    const filteredCommits = commits.filter(
      commit => commit.ref === 'refs/heads/main'
    )
    const shaIndex = filteredCommits.findIndex(
      commit => commit.sha === metrics.sha
    )
    const commit = filteredCommits[shaIndex + 1]
    const result = {
      jiraKey: jiraIssueKey,
      commit: metrics.sha,
      author: metrics.actor,
      startDate,
      endDate: metrics.dateUtc,
      estimate,
      actual: metrics.totalComplexity - commit.totalComplexity,
      duration: getRealisticDuration(startDate, metrics.dateUtc)
    }
    console.table(result)
  })
