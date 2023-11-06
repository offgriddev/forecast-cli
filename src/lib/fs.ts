import fs from 'fs/promises'
import {CodeMetrics, DeliveryProjectionConfig} from '../types'

/**
 * getCommitMetrics retrieves commits
 */
export async function getCommitMetrics(
  directory = './data/commit-metrics'
): Promise<CodeMetrics[]> {
  const files = await fs.readdir(directory)
  const content: CodeMetrics[] = []
  for (const file of files) {
    const fileContent = await fs.readFile(`${directory}/${file}`, 'utf-8')
    content.push(JSON.parse(fileContent))
  }

  return content.sort((a, b) =>
    a.dateUtc === b.dateUtc ? 0 : a.dateUtc < b.dateUtc ? 1 : -1
  )
}

export async function readConfig(
  path: string
): Promise<DeliveryProjectionConfig> {
  const content = await fs.readFile(path, 'utf-8')
  return JSON.parse(content) as DeliveryProjectionConfig
}
