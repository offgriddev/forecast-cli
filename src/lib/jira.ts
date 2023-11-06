import {request} from 'undici'
import querystring from 'querystring'
import {JiraConfig, JiraIssue, JiraIssueChangelog, SlimJira} from '../types'

function getHeaders(
  username: string,
  password: string
): Record<string, string> {
  const creds = Buffer.from(`${username}:${password}`, 'utf-8').toString(
    'base64'
  )
  return {
    authorization: `Basic ${creds}`,
    'Content-Type': 'application/json',
    Accept: '*/*'
  }
}

// export async function searchForIssuesByEpic(/*issueKeys: string[]*/) {}

export async function getIssue(
  key: string,
  config: SlimJira
): Promise<JiraIssue> {
  const headers = getHeaders(config.username, config.password)
  const url = `${config.host}/rest/api/3/issue/${key}`
  const res = await request(url, {
    headers
  })

  return res.body.json()
}

export async function getIssueChangelog(
  key: string,
  config: SlimJira
): Promise<JiraIssueChangelog> {
  const res = await request(
    `${config.host}/rest/api/3/issue/${key}/changelog`,
    {
      headers: getHeaders(config.username, config.password)
    }
  )

  return res.body.json()
}

export async function retrieveJiraIssueChangelogs(
  issueKeys: string[],
  config: SlimJira
): Promise<JiraIssueChangelog[]> {
  // may get throttled
  const promisedChangeLog = await Promise.all(
    issueKeys.map(async issue => await getIssueChangelog(issue, config))
  )
  return promisedChangeLog
}

export async function retrieveJiraEpicIssues(config: JiraConfig): Promise<{
  total: number
  issues: JiraIssue[]
}> {
  const query = {
    jql: `"Epic Link" in (${config.epicKeys.join(',')}) order by created DESC`,
    maxResults: 100,
    fields: `id,key,${config.fields.map(field => field.from).join(',')},created`
  }
  const res = await request(
    `${config.host}/rest/api/3/search?${querystring.stringify(query)}`,
    {
      headers: getHeaders(config.username, config.password)
    }
  )

  return res.body.json()
}

export async function retrieveOutstandingJiraEpicIssues(
  config: JiraConfig
): Promise<{
  total: number
  issues: JiraIssue[]
}> {
  const query = {
    jql: `"Epic Link" in (${config.epicKeys.join(
      ','
    )}) and status not in (Archived, Closed, "Closed - Duplicate") order by created DESC`,
    maxResults: 100,
    fields: `id,key,${config.fields
      .map(field => field.from)
      .join(',')},created,status`
  }
  const res = await request(
    `${config.host}/rest/api/3/search?${querystring.stringify(query)}`,
    {
      headers: getHeaders(config.username, config.password)
    }
  )

  return res.body.json()
}
