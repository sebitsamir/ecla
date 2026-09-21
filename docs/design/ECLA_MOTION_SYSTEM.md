# ECLA MOTION SYSTEM
## Motion as Meaning

# 1. Principle

Motion is part of Ecla's pedagogy.

It should communicate:
- where the learner is
- what changed
- what caused the change
- what now matters

Motion is never decoration alone.

---

# 2. Motion Classes

## Micro
80–160ms

Use for:
- hover
- press
- toggle
- focus
- icon state

## UI
160–260ms

Use for:
- panels
- tabs
- menus
- hint reveal
- button state

## Experience
320–700ms

Use for:
- entering scene
- changing lesson state
- character transitions
- major panel transition

## Reflective
700–1400ms

Use for:
- mastery state
- retention confirmation
- session conclusion
- capability reveal

---

# 3. Easing

Primary:
cubic-bezier(0.22, 1, 0.36, 1)

Exit:
cubic-bezier(0.4, 0, 1, 1)

Gentle ambient:
ease-in-out

Avoid spring bounce unless physically meaningful.

---

# 4. Scene Entry

Sequence:

1. environment fades from black
2. spatial layers settle
3. character appears
4. dialogue enters
5. interaction becomes active

Never animate everything simultaneously.

---

# 5. Correct Response

Do not:
- flash green
- explode confetti
- bounce card

Instead:

1. learner response remains visible
2. scene softens
3. character responds
4. Language Thread traces forward
5. next state enters

---

# 6. Incorrect Response

Do not shake aggressively.

Pattern:

1. answer gently recedes
2. supporting clue appears
3. relevant phrase is emphasized
4. learner can retry quickly

The UI should communicate:
“Here is what will help.”

Not:
“You failed.”

---

# 7. Independent Success

If the learner performs without support:

- hints fade completely
- scene light subtly strengthens
- response is recognized
- a short capability message may appear

Example:

“You handled that without help.”

This should be one of Ecla's most satisfying states.

---

# 8. Mastery Transition

EXPOSED → DEVELOPING:
small node fill

DEVELOPING → CONTROLLED:
stronger inner light

CONTROLLED → TRANSFERRED:
connection extends to another context

TRANSFERRED → RETAINED:
node becomes stable and fully illuminated

This is a semantic animation system.

---

# 9. Voice Motion

Listening:
- low amplitude responsive field
- character listening state
- surrounding content quiets

Processing:
- waveform settles into a thin Language Thread

Understood:
- thread resolves forward
- character responds

Repair:
- phrase fragment is isolated and highlighted

---

# 10. Ambient Motion

Allowed:
- slow light drift
- barely perceptible scene depth
- environmental movement
- subtle solid-color temperature shifts

Disallowed:
- floating random bubbles
- permanent moving noise
- aggressive parallax
- infinite icon animation

---

# 11. Navigation

Navigation transitions should preserve context.

Example:
Home → Scene

The Continue Journey surface should visually transform into the scene entry rather than hard-cut when possible.

---

# 12. Reduced Motion

When prefers-reduced-motion is enabled:

- remove ambient motion
- replace spatial transitions with fades
- disable parallax
- preserve state communication
- keep durations short

Premium interaction must not depend on animation.
