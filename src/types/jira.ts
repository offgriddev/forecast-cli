export type GetIssueConfig = {
  key?: string
  username: string
  password: string
  host: string
  fields?: string
}

export type JiraIssue =
  | {
      id: string
      self: string
      key: string
      fields: Record<string, string>
      estimate: number
    } & Record<string, number | string | Record<string, string>>

export type FieldChange = {
  field: string
  fieldType: string
  from: number
  fromString: string
  to: string
  toString: string
}
export type Author = {
  self: string
  accountId: string
  emailAddress: string
}
export type ChangeLogAuthor = {
  id: string
  author: Author
  displayName: string
  active: boolean
  timeZone: string
  accountType: string
}

export type ChangeLogItem = {
  id: string
  author: ChangeLogAuthor
  created: string
  items: FieldChange[]
}
export type JiraIssueChangelog = {
  self: string
  maxResults: number
  startAt: number
  total: number
  isLast: boolean
  values: ChangeLogItem[]
}

export type FieldMapping = {
  from: string
  to: string
}
export type JiraConfig = {
  /**
   * Indicate which logs should be part of the start date calculation
   */
  startSignal: string[]
  /**
   * Indicators for when a card in an issue is considered outstanding
   */
  unfinishedIndicators: string[]
  /**
   * Command-delimited list of issue keys for Jira Epics
   */
  epicKeys: string[]
  /**
   * Custom fields in Jira issue to include, must include estimate
   */
  fields: FieldMapping[]
} & SlimJira

export type SlimJira = {
  /**
   * Username for Basic auth
   */
  username: string
  /**
   * Password for Basic auth (PAT)
   */
  password: string
  /**
   * Base URI for your Jira instance
   */
  host: string
}

export type Card = {
  estimate: number
  issueKey: string
} & Record<string, unknown>
