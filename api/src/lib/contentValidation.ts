/**
 * Content validation bridge — Phase 18.
 * Re-exports prisma/content validation for API routes.
 */
export { runContentValidation, validatePhases, type Report } from '../../prisma/content/validate'
export { phases } from '../../prisma/content/phases'
