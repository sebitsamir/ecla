import {
    Fingerprint, Zap, HelpCircle, UtensilsCrossed, Hash, Clock, MapPin,
    Users, Heart, Palette, Briefcase, BookOpen, type LucideIcon,
} from 'lucide-react'

export type Category = {
    id: string
    label: string
    icon: LucideIcon
    color: string
}

/* Ordered — first match wins.
   `being` sits ABOVE `emotions` so "Ser vs Estar (Emotions)" classifies
   as a being-verb (fingerprint), not a feeling (heart).
   \b word boundaries prevent substring accidents. */
const MATCHERS: (Category & { re: RegExp })[] = [
    { id: 'food',      label: 'Food & Dining',       icon: UtensilsCrossed, color: '#FF8A5C', re: /\b(food|eat|eating|restaurant|meal|drink|taste|kitchen)\b/ },
    { id: 'numbers',   label: 'Numbers & Money',     icon: Hash,            color: '#7FA6FF', re: /\b(numbers?|count|how many|age|price|money|cost)\b/ },
    { id: 'time',      label: 'Time & Routine',      icon: Clock,           color: '#8FD694', re: /\b(time|date|when|clock|daily|routine|hour|week)\b/ },
    { id: 'places',    label: 'Places & Directions', icon: MapPin,          color: '#F09D2E', re: /\b(place|places|location|where|city|directions?|street|country|town|travel|village)\b/ },
    { id: 'people',    label: 'People & Family',     icon: Users,           color: '#FF9EB5', re: /\b(family|friend|friends|people|relationship|person)\b/ },
    { id: 'being',     label: 'Being & Identity',    icon: Fingerprint,     color: '#FFC857', re: /\b(identity|name|names|self|who|intro|ser|estar|being|gustar)\b/ },
    { id: 'emotions',  label: 'Feelings & Moods',    icon: Heart,           color: '#FF6B81', re: /\b(emotions?|feelings?|feel|moods?|happy|sad|love)\b/ },
    { id: 'tense',     label: 'Verb Tense',          icon: Zap,             color: '#4DD8E6', re: /\b(present|past|preterite|imperfect|future|conditional|conjugat\w*|tense|tenses|verb|verbs)\b/ },
    { id: 'questions', label: 'Questions',           icon: HelpCircle,      color: '#B98CF0', re: /\b(questions?|ask|asking|interrogative)\b/ },
    { id: 'describe',  label: 'Description',         icon: Palette,         color: '#E0A6FF', re: /\b(describ\w*|adjectives?|colou?rs?|appearance)\b/ },
    { id: 'work',      label: 'Work & Professional', icon: Briefcase,       color: '#9AB8DC', re: /\b(work|job|office|business|professional|career)\b/ },
]

export const DEFAULT_CATEGORY: Category = {
    id: 'grammar', label: 'Grammar', icon: BookOpen, color: '#F4F1EA',
}

export function categoryFor(name: string): Category {
    const n = name.toLowerCase()
    return MATCHERS.find(m => m.re.test(n)) ?? DEFAULT_CATEGORY
}

export const CATEGORIES: Category[] = [...MATCHERS, DEFAULT_CATEGORY]