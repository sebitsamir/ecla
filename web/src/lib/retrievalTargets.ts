/**
 * retrievalTargets — Phase 21: engine-first retrieval (no legacy exercises).
 */
import { extractEngine } from '@/lib/lessonPayload'

/** Pull speakable targets from the 9-stage engine payload only. */
export function retrievalTargetsFromLesson(lesson: any, mode = 'STORY'): string[] {
    const engine = extractEngine(lesson, mode)
    const lt = (engine?.languageTargets ?? {}) as Record<string, unknown>
    const examples = Array.isArray(lt.examples) ? lt.examples.map(String) : []
    const chunks = Array.isArray(lt.chunks) ? lt.chunks.map(String) : []
    const patterns = Array.isArray(lt.patterns) ? lt.patterns.map(String) : []
    const vocab = Array.isArray(lt.vocabulary) ? lt.vocabulary.map(String) : []
    return [...new Set([...examples, ...chunks, ...patterns, ...vocab].filter(s => s.trim().length > 0))]
}

export function lessonHasEngine(lesson: any): boolean {
    return !!extractEngine(lesson)
}
