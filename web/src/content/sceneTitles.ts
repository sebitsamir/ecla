/**
 * Scene titles — presentation layer over curriculum codes.
 * Blueprints (Unit 1) win; DB competency title is the fallback.
 */
import { UNIT1 } from '@/lib/blueprint'

const TITLES = new Map(UNIT1.map(bp => [bp.competency.trim(), bp.title]))

export function sceneTitleFor(code: string, fallback?: string | null): string {
    const key = String(code ?? '').trim()
    return TITLES.get(key) ?? fallback ?? key
}
