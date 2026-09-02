export const PILOT_REPORT_CONTRACT = 'ecla.educational-pilot-report/1' as const

export type CalibrationRow = {
  competencyCode: string | null
  situationId: string | null
  predictedMastery: number
  observedPerformance: number
  absoluteError: number
}

export type PilotReport = {
  contract: typeof PILOT_REPORT_CONTRACT
  study: { slug: string; status: string; protocolVersion: string; durationWeeks: number }
  enrollment: { invited: number; consented: number; active: number; withdrawn: number; targetMin: number; targetMax: number }
  completeness: { weeklyInterviews: number; externalAssessments: number; ultimateSituations: number; delayedRetentionTests: number }
  calibration: {
    pairedObservations: number
    meanAbsoluteError: number | null
    meanPrediction: number | null
    meanObservedPerformance: number | null
    overPrediction: number | null
    thresholdAgreement: number | null
    rows: CalibrationRow[]
  }
  blockers: string[]
  generatedAt: string
}
