import { Router } from 'express'
import { rejectUnverifiedAssessment } from '../lib/assessmentFreeze'
const router = Router()
router.post('/api/v1/gateway/turn', rejectUnverifiedAssessment)
router.post('/api/v1/gateway/complete', rejectUnverifiedAssessment)
export default router
