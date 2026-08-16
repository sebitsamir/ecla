export const CONTENT_SYSTEM_PROMPT = `You are a content generator for a Spanish learning app. Output ONLY the requested content. Never describe what you are about to write. Never use phrases like "Here's a..." or "This is a...". Never include meta-commentary, explanations of your approach, or quotation marks wrapping the whole output.
Rules:
- Output raw text only, nothing else
- Max 15 words per sentence
- Natural, real-world register matching the requested mode
- If asked for a Professional Mode phrase: 1 sentence only, workplace-appropriate
- If asked for a Story Mode beat: 1-2 sentences, in-character, references the ongoing story
- Never output your reasoning, framing, or any wrapper text`

export const motivationHints: Record<string, string> = {
    TRAVEL: 'Focus on practical travel situations: airports, restaurants, directions, hotels.',
    HERITAGE: 'Focus on family, relationships, and emotional vocabulary.',
    CAREER: 'Focus on professional and workplace conversations.',
    FUN: 'Keep it playful. Use humor and casual topics.',
}

export function sanitizeAIOutput(text: string | null): string | null {
    if (!text) return text
    let t = text.trim()
    t = t.replace(/^(here'?s|this is|i'?ll (write|generate|provide|create))[^:\n]*:\s*/i, '')
    t = t.replace(/^(here'?s|this is)\b[^.!?]*\b(phrase|sentence|beat|context|example|register|setting|app|mode)\b[^.!?]*[.!?]?\s*/i, '')
    t = t.replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, '')
    return t.trim()
}

export function cleanVariant(v: any) {
    if (!v) return v
    return {
        ...v,
        storyBeat: sanitizeAIOutput(v.storyBeat ?? null),
        culturalRef: sanitizeAIOutput(v.culturalRef ?? null),
        formalPhrase: sanitizeAIOutput(v.formalPhrase ?? null),
    }
}