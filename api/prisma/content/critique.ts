/** Run before human review: npx tsx prisma/content/critique.ts */
import { phases } from './phases'
import { critiquePhases } from './validate'

critiquePhases(phases).then(issues => {
    console.log(issues.length ? `Critique issues:\n- ${issues.join('\n- ')}` : 'No critique issues.')
    process.exit(0)
})