import {
  Card,
  ChangeLogItem,
  JiraIssue,
  JiraIssueChangelog,
  FieldMapping
} from '../types'

export function mapJiraIssuesToCardModels(
  issues: JiraIssue[],
  customfieldMapping: FieldMapping[]
): Card[] {
  const cards = []
  for (const issue of issues) {
    const card: Card = {
      issueKey: issue.key,
      estimate: +issue.fields[customfieldMapping[0].from]
    }
    cards.push(card)
  }
  return cards
}

export function prepareCustomFields(
  fields: string
): {from: string; to: string}[] {
  return fields.split(',').map(fieldSet => {
    const both = fieldSet.split(':')
    return {
      from: both[0],
      to: both[1]
    }
  })
}

export function findCard(jiraKey: string, cards: JiraIssue[]): JiraIssue {
  return cards.find(card => card.key === jiraKey)!
}

export function findChangelogForKey(
  jiraKey: string,
  changelogs: JiraIssueChangelog[]
): JiraIssueChangelog {
  return changelogs.find(changelog => changelog.self.includes(jiraKey))!
}

export function findChangeLog(
  values: ChangeLogItem[],
  ids: string[]
): ChangeLogItem {
  for (const log of values) {
    const found = log.items.find(item => ids.includes(item.to))
    if (found) return log
  }
  return {} as ChangeLogItem
}
