import {CodeMetrics} from '../types'
import {getCommitMetrics} from './fs'

export function filterMetricsStartDate(commits: CodeMetrics[]): CodeMetrics[] {
  return commits.filter(
    metric =>
      new Date(metric.dateUtc) > new Date('2023-04-30T01:10:49.975Z') &&
      metric.ref === 'refs/heads/main'
  )
}
/**
 * structureRepositoryCommits retrieves code commits from storage
 * by a given set of repositories being used on a project
 */
export async function structureRepositoryCommits(
  repositories: string[]
): Promise<CodeMetrics[]> {
  const commitMetrics = await getCommitMetrics()

  // anonymize developers here
  return commitMetrics.filter(commit =>
    repositories.includes(commit.repository?.repo)
  )
}
export function findLastCommitForRepo(
  filtered: CodeMetrics[],
  repo: string,
  index: number
): CodeMetrics | undefined {
  for (let i = index; i < filtered.length; i++) {
    const commit = filtered[i]
    if (commit.repository.repo === repo) {
      return commit
    }
  }
  return undefined
}

export function getJiraIssueKeyFromReport(report: CodeMetrics): string {
  return report.head.split('/')[1].replace('_', '-')
}
