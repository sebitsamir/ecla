/**
 * Error classification — Phase 34: every error has a diagnosis.
 */
export type ErrorCategory =
    | 'comprehension'
    | 'retrieval'
    | 'vocabulary'
    | 'grammar'
    | 'pronunciation'
    | 'pragmatics'
    | 'interaction'
    | 'repair'
    | 'transfer'

export type ClassifiedError = {
    category: ErrorCategory
    diagnosis: string
    remediation: string
}

const REPAIR_MISS = /(no entiendo|repite|más despacio)/i
const PRONUNCIATION = /(no te entiendo|otra vez|más claro)/i

export function classifyError(input: {
    expected?: string
    response?: string
    stage?: string
    repairAttempted?: boolean
    contextChanged?: boolean
}): ClassifiedError {
    const { expected, response, stage, repairAttempted, contextChanged } = input
    const resp = (response ?? '').trim().toLowerCase()
    const exp = (expected ?? '').trim().toLowerCase()

    if (stage === 'TRANSFER' && !contextChanged) {
        return {
            category: 'transfer',
            diagnosis: 'Response worked in the original context but not the new one.',
            remediation: 'Practice the same function in a different location with less support.',
        }
    }
    if (repairAttempted === false && stage === 'INTERACT') {
        return {
            category: 'repair',
            diagnosis: 'Misunderstanding occurred but repair language was not used.',
            remediation: 'Try "¿Puedes repetir?" or "Más despacio, por favor."',
        }
    }
    if (PRONUNCIATION.test(resp) || (resp && exp && !resp.includes(exp.split(' ')[0]))) {
        return {
            category: 'pronunciation',
            diagnosis: 'Meaning may have been unclear to the listener.',
            remediation: 'Slow down and stress the key word. Listen again, then retry.',
        }
    }
    if (stage === 'RETRIEVE' || stage === 'PRODUCE') {
        return {
            category: 'retrieval',
            diagnosis: 'Could not retrieve the target pattern under pressure.',
            remediation: 'Short drill, then return to the scene with a hint.',
        }
    }
    if (stage === 'UNDERSTAND' || stage === 'NOTICE') {
        return {
            category: 'comprehension',
            diagnosis: 'Meaning of the input was not grasped.',
            remediation: 'Listen again with translation support, then notice the pattern.',
        }
    }
    if (REPAIR_MISS.test(exp)) {
        return {
            category: 'interaction',
            diagnosis: 'Interaction broke down.',
            remediation: 'Keep the exchange going with a short response or repair phrase.',
        }
    }
    return {
        category: 'vocabulary',
        diagnosis: 'Wrong word or missing key vocabulary.',
        remediation: 'Review the target patterns, then try in the same scene.',
    }
}
