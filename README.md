# ECLA

**Evidence-Centered Language Acquisition**

ECLA is a language-learning platform designed around one question:

> **Can the learner actually use the language in a real situation?**

Instead of treating lessons as a sequence of pages, points, or isolated quizzes, ECLA models language learning as a progression of **competencies, experiences, evidence, transfer, and retention**.

The initial curriculum focuses on **Spanish Pre-A1** and is built to grow into a broader multi-language learning system.

## Why ECLA exists

Many language-learning products are good at measuring activity:

- lessons completed,
- questions answered,
- streaks maintained,
- points earned.

Those signals are useful, but they do not necessarily prove that a learner can **retrieve, produce, interact, transfer, and retain** the language.

ECLA is designed around a different product promise:

> **“I can actually do that in Spanish.”**

The software supports the curriculum—not the other way around.

## Core learning model

ECLA uses an evidence-based mastery ladder:

```text
NOT_STARTED
    ↓
EXPOSED
    ↓
DEVELOPING
    ↓
CONTROLLED
    ↓
TRANSFERRED
    ↓
RETAINED
```

A learner does not reach mastery from a single `correct / total` score.

Progress can incorporate evidence across:

- comprehension,
- retrieval,
- production,
- interaction,
- application,
- transfer,
- retention.

This lets the system distinguish between **recognizing something with support** and **being able to use it independently in a new context**.

## Curriculum architecture

ECLA separates **what must be learned** from **how it is experienced**.

```text
Curriculum
   │
   ▼
Competencies
   │
   ├── Language realizations
   ├── Vocabulary
   ├── Prerequisites
   ├── Learning experiences
   ├── Missions
   └── Scenes
          │
          ▼
     Learner evidence
          │
          ▼
    Mastery + review
```

This separation allows the same competency to be taught through different experience types without duplicating the underlying curriculum.

### Experience types

The current data model supports:

- **Story**
- **Drill**
- **Immersion**
- **Professional**
- **Mission**

Scenes add a richer presentation layer with environments, characters, activities, variations, transfer tasks, assessment configuration, and mastery metadata.

## Key capabilities

### Competency-driven curriculum

Courses are organized into:

```text
Language → Course → Unit → Competency
```

Each competency can define:

- a unique competency code,
- a learner-facing “can do” objective,
- domain and level,
- prerequisite competencies,
- difficulty,
- XP reward,
- language-specific realization,
- associated vocabulary,
- learning experiences,
- missions,
- scenes.

### Evidence-weighted mastery

ECLA tracks more than completion state.

The learner model can retain evidence for:

- comprehension,
- retrieval,
- interaction,
- application,
- transfer,
- retention,
- confidence,
- context diversity,
- success and failure history,
- repair completion.

### Transfer and retention

`CONTROLLED` performance can unlock progression, but ECLA treats **transfer** and **retention** as stronger evidence.

A learner can therefore be asked to demonstrate the same competency:

1. with support,
2. in a different context,
3. again after a delay.

### Spaced vocabulary review

Vocabulary progress stores:

- repetition count,
- interval,
- ease factor,
- next review time.

This supports scheduled review rather than one-time exposure.

### Missions

Missions model purposeful language use through:

- scenario,
- objective,
- difficulty,
- success criteria,
- configuration,
- attempts,
- evidence,
- feedback,
- pass/fail outcome.

### Character memory and learner events

The platform includes persistence for recurring character encounters and learner events, enabling the experience layer to become more continuous and context-aware over time.

### Authentication and user continuity

ECLA uses **Clerk** for identity and maintains application-level learner records for onboarding, motivation, preferred learning mode, progression, streaks, XP, and mastery.

### Product analytics

The web application includes **PostHog** integration for product analytics and learning-flow observation.

## Technology stack

### Web

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Clerk
- PostHog
- Lucide React

### API

- Node.js
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- Clerk Express
- Zod
- Groq SDK

### Data

- PostgreSQL
- Prisma migrations and generated client
- Structured curriculum seed/validation tooling

## Repository structure

```text
ecla/
├── ECLA.md                 # Product / learning constitution
├── api/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── content/
│   ├── src/
│   ├── tests/
│   └── package.json
├── docs/
└── web/
    ├── src/
    └── package.json
```

## Development

### Prerequisites

- Node.js
- PostgreSQL
- Clerk application credentials

### 1. Clone

```bash
git clone https://github.com/sebitsamir/ecla.git
cd ecla
```

### 2. Install API dependencies

```bash
cd api
npm install
```

Configure the required environment variables, including your PostgreSQL connection and Clerk credentials.

Generate Prisma:

```bash
npm run prisma:generate
```

Apply migrations:

```bash
npm run prisma:migrate
```

Seed curriculum/content as needed:

```bash
npm run seed:structure
npm run seed:content
```

Run the API:

```bash
npm run dev
```

### 3. Run the web application

In another terminal:

```bash
cd web
npm install
npm run dev
```

---

## Content validation

ECLA includes curriculum validation tooling:

```bash
npm run validate:content
npm run validate:curriculum
```

This is important because curriculum correctness is treated as a product invariant rather than an informal content concern.

## Testing

From `api/`:

```bash
npm test
```

The API uses Node/TypeScript test execution through `tsx`.

## Engineering principles

### Curriculum is authoritative

If the software contradicts the curriculum, the software is considered wrong.

### Evidence is stronger than activity

Completion, XP, and streaks can support motivation, but they do not substitute for evidence of language ability.

### Transfer cannot be fabricated

A transfer score should come from performance in a genuinely different context, not from synthetic arithmetic over unrelated quiz results.

### Presentation is decoupled from pedagogy

Scenes and experience types determine how a learner encounters a competency. The curriculum determines what the competency means.

## Current status

**Active development.**

The repository contains the foundations for curriculum-driven Spanish learning, learner progression, competency mastery, experiences, missions, scenes, vocabulary review, authentication, and product analytics.

ECLA should currently be presented as an ambitious, functioning learning platform under active development—not as a completed commercial language-learning service.

## Roadmap direction

Key product areas include:

- completing and validating the Pre-A1 curriculum,
- strengthening scene quality and continuity,
- richer production and interaction assessment,
- stronger adaptive repair flows,
- improved transfer/retention evidence,
- expanded learner analytics,
- additional CEFR levels,
- additional languages.

## Author

**Sebit Samir**

Software Engineer / Full-Stack Developer

GitHub: [@sebitsamir](https://github.com/sebitsamir)
