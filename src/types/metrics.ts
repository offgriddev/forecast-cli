export type HalsteadMetrics =
  | {
      length: number
      vocabulary: number
      volume: number
      difficulty: number
      effort: number
      time: number
      bugsDelivered: number
      operands: OperationMetrics
    }
  | {}
  | Record<string, unknown>

export type OpExpression = {
  items?: (string | number)[]
  total: number
  _unique: Set<string | number>
  unique: number
}

export type OperationMetrics = {
  operands: OpExpression
  operators: OpExpression
}

export type ComplexityResult = {
  source: string
  metrics: Record<string, HalsteadMetrics & {complexity: number}>
}

export type CodeMetrics = {
  totalComplexity: number
  sha: string
  actor: string
  head: string
  actorName?: string
  repository: {owner: string; repo: string}
  ref: string
  analysis: ComplexityResult[]
  dateUtc: string
}
