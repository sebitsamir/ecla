# ECLA UI ARCHITECTURE
## Product Surface & Component System

# 1. Architecture Goal

The visual system must prevent individual pages from inventing their own UI.

Ecla should be implemented as four layers:

```text
FOUNDATIONS
    ↓
PRIMITIVES
    ↓
ECLA PRODUCT COMPONENTS
    ↓
EXPERIENCES
```

No experience page should directly improvise colors, spacing, shadows, button styles, or typography.

---

# 2. Foundations

## Tokens

Create:

- color.ts
- typography.ts
- spacing.ts
- radius.ts
- elevation.ts
- motion.ts
- breakpoints.ts
- zIndex.ts

CSS custom properties should be generated from the design tokens.

---

# 3. Primitive Components

Required:

- Button
- IconButton
- TextField
- TextArea
- Select
- Switch
- Checkbox
- Radio
- Tooltip
- Popover
- Dialog
- Sheet
- Menu
- Tabs
- SegmentedControl
- ProgressPrimitive
- Toast
- Skeleton
- Divider

All must support:

- sizes
- semantic states
- disabled
- loading
- keyboard focus
- reduced motion
- dark surfaces

---

# 4. Ecla Product Components

## EclaShell
Controls global page composition.

## WorldHeader
Contextual top bar for learner experiences.

## SceneFrame
Main immersive lesson container.

## CharacterPresence
Character visual + state + memory context.

## DialogueTurn
Speaker, phrase, translation support, replay.

## SpeakControl
Press/tap speaking interaction.

## LanguageThread
Signature visual connector.

## CompetencyNode
Visual mastery state.

## CapabilityStatement
“You can now…”

## EvidenceSummary
Shows why Ecla believes something is mastered.

## ContinueJourney
Dominant next action.

## ReviewMoment
Compact recall interaction.

## MissionBrief
Focused mission launch screen.

## MasteryTransition
Reflective mastery progression.

## ProgressConstellation
Connected competency map.

## SceneEnvironment
Atmospheric scene canvas.

## AdaptiveHint
Support that can visually fade with mastery.

## SessionReflection
Post-session summary.

## MemoryEcho
Subtle callback to previous character/scene experience.

---

# 5. Global Navigation

Primary learner navigation:

- Learn
- Practice
- Progress

Secondary:
- profile
- settings
- help

Never expose all backend concepts as nav destinations.

---

# 6. Home

Sections:

1. Contextual opening
2. Continue Journey
3. Capability gained
4. Review signal
5. Learning world preview

No KPI dashboard.

---

# 7. Learn

Structure:

- current level
- active arc
- competency journey
- scenes
- missions
- prerequisites

Use spatial progression, not dense lists.

---

# 8. Scene Player

State machine:

```text
ENTER
↓
ORIENT
↓
ENCOUNTER
↓
UNDERSTAND
↓
RESPOND
↓
EVALUATE
↓
ADAPT
↓
CONTINUE
↓
REFLECT
```

The UI should transition according to state rather than render all controls at once.

---

# 9. Practice

Practice should automatically prioritize:

- due review
- fragile competencies
- recent errors
- transfer opportunities
- pronunciation repair

Avoid forcing learners to choose from twenty practice modes.

---

# 10. Progress

Progress is composed of:

- competency constellation
- retained capabilities
- recent growth
- fragile areas
- transfer evidence
- retention evidence

Avoid XP dominance.

---

# 11. Voice

Dedicated full-screen mode on mobile.

States:

- idle
- listening
- processing
- understood
- repair needed
- retry
- complete

---

# 12. Onboarding

Goal:
Get a learner to a meaningful first language action as quickly as possible.

Do not ask unnecessary profile questions before first value.

Recommended:

1. language
2. motivation
3. current ability
4. preferred pace
5. first micro-scene

Profile refinement can happen later.

---

# 13. Admin

Admin can be denser, but must retain Ecla identity.

Use:
- functional tables
- editorial detail panels
- strong filters
- clear review workflow
- version metadata

Do not use consumer cinematic UI for admin tasks.

---

# 14. Responsive Rules

## Desktop
Spatial composition.
Wider environments.
Contextual panels.

## Tablet
Reduced side content.
Preserve scene immersion.

## Mobile
Single-focus state.
Bottom controls.
Full-screen transitions.

---

# 15. State Coverage

Every component must define:

- default
- hover
- focus
- active
- disabled
- loading
- success
- error
- empty

No component is complete without these.

---

# 16. Implementation Rule

New pages may not introduce one-off styles if an equivalent token or component exists.

If a new visual need appears:
1. decide whether it is reusable
2. add it to the system
3. use it in the experience

This prevents UI drift.
