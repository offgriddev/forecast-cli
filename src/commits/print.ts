import {Command} from 'commander'
import {getCommitMetrics} from '../lib/fs'
import {CodeMetrics} from '../types'
import {findLastCommitForRepo} from '../lib/commits'

export const printCommits = new Command()
  .name('print')
  .alias('p')
  .option(
    '-R, --repos <repos>',
    'Comma-delimited list of repositories to estimate from'
  )
  .action(async (options: {repos: string}) => {
    const items = await getCommitMetrics()
    const slim: unknown[] = []

    function filterCommitsToRepositories(repos: string[]): CodeMetrics[] {
      const commits = items.filter(item => !!item?.repository?.repo)
      if (!repos.length) {
        return commits
      }
      return commits.filter(item => repos.includes(item.repository.repo))
    }

    // change to for loop to calculate delta
    const filteredCommits = filterCommitsToRepositories(
      options.repos.split(',')
    )

    for (let i = 0; i < filteredCommits.length; i++) {
      const {sha, actor, head, ref, totalComplexity, repository, dateUtc} =
        filteredCommits[i]
      const prev = findLastCommitForRepo(
        filteredCommits,
        repository.repo,
        i + 1
      ) //filteredCommits[i + 1]

      slim.push({
        sha,
        actor,
        issue: head?.split('/')[1].replace('_', '-'),
        ref: ref.includes('heads') ? `${ref} (prod)` : `${ref} (dev)`,
        totalComplexity,
        delta: !prev ? 0 : totalComplexity - prev.totalComplexity,
        dateUtc,
        repo: repository?.repo
      })
    }

    console.table(slim)
  })
