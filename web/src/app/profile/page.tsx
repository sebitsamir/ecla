'use client'

import { useEffect, useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from 'react'
import Image from 'next/image'
import { useClerk, useUser } from '@clerk/nextjs'
import { ArrowDownToLine, Briefcase, Check, Clock3, ExternalLink, Heart, Laptop, LogOut, Moon, Plane, Shield, Sparkles, Sun, Trash2, UserRound } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import ApiState from '@/components/ApiState'
import { useTheme, type ThemePreference } from '@/components/ThemeProvider'
import { useAuthReady } from '@/hooks/useAuthReady'
import { apiFetch, authFetch, ApiError } from '@/lib/apiClient'

type Motivation = 'TRAVEL' | 'HERITAGE' | 'CAREER' | 'FUN'
type Pace = 20 | 50 | 100
type LearnerAccount = { email: string; displayName: string | null; motivation: Motivation | null; dailyGoalXp: number; currentLevel: string | null }
type IconType = ComponentType<{ className?: string }>

const THEMES: Array<{ id: ThemePreference; label: string; description: string; icon: IconType }> = [
  { id: 'system', label: 'System', description: 'Match this device', icon: Laptop },
  { id: 'light', label: 'Light', description: 'Ivory Day', icon: Sun },
  { id: 'dark', label: 'Dark', description: 'Nocturne', icon: Moon },
]
const MOTIVATIONS: Array<{ id: Motivation; label: string; icon: IconType }> = [
  { id: 'TRAVEL', label: 'Travel', icon: Plane }, { id: 'HERITAGE', label: 'Family & heritage', icon: Heart },
  { id: 'CAREER', label: 'Work & study', icon: Briefcase }, { id: 'FUN', label: 'Personal growth', icon: Sparkles },
]
const PACES: Array<{ id: Pace; label: string; detail: string }> = [
  { id: 20, label: 'Gentle', detail: 'About 5 minutes' }, { id: 50, label: 'Steady', detail: 'About 10 minutes' },
  { id: 100, label: 'Deep', detail: '20 minutes or more' },
]

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="border-t border-line py-7 first:border-t-0 first:pt-0 sm:py-9"><div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10"><div><h2 className="font-display text-2xl text-ivory sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-stone">{description}</p></div><div className="min-w-0">{children}</div></div></section>
}

export default function ProfilePage() {
  const { isLoaded, isSignedIn, getToken } = useAuthReady()
  const { user } = useUser()
  const clerk = useClerk()
  const { preference, setPreference } = useTheme()
  const [account, setAccount] = useState<LearnerAccount | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [motivation, setMotivation] = useState<Motivation | null>(null)
  const [dailyGoalXp, setDailyGoalXp] = useState<Pace>(50)
  const [learningConfirmation, setLearningConfirmation] = useState('')
  const [accountConfirmation, setAccountConfirmation] = useState('')

  const load = async () => {
    setError(null)
    try {
      const value = await apiFetch<LearnerAccount>('/api/v1/users/me', getToken)
      setAccount(value); setMotivation(value.motivation)
      setDailyGoalXp(PACES.some(pace => pace.id === value.dailyGoalXp) ? value.dailyGoalXp as Pace : 50)
    } catch (reason) { setError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not load your account.')) }
  }

  useEffect(() => { if (isLoaded && isSignedIn) void load() }, [isLoaded, isSignedIn]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (user) { setFirstName(user.firstName ?? ''); setLastName(user.lastName ?? '') } }, [user])
  const displayName = useMemo(() => [firstName, lastName].filter(Boolean).join(' ') || account?.displayName || 'Learner', [account?.displayName, firstName, lastName])

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault(); setBusy('profile'); setNotice(null); setError(null)
    try {
      await apiFetch('/api/v1/users/me', getToken, { method: 'PATCH', body: JSON.stringify({ firstName, lastName }) })
      await user?.reload(); setNotice('Your profile has been updated.'); await load()
    } catch (reason) { setError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not update your profile.')) }
    finally { setBusy(null) }
  }
  const saveLearning = async () => {
    setBusy('learning'); setNotice(null); setError(null)
    try {
      await apiFetch('/api/v1/users/me/preferences', getToken, { method: 'PATCH', body: JSON.stringify({ motivation, dailyGoalXp }) })
      setNotice('Your learning preferences have been saved.'); await load()
    } catch (reason) { setError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not update your learning preferences.')) }
    finally { setBusy(null) }
  }
  const exportData = async () => {
    setBusy('export'); setNotice(null); setError(null)
    try {
      const response = await authFetch('/api/v1/privacy/export', getToken)
      if (!response.ok) throw new ApiError('server', 'Your export could not be prepared.', response.status)
      const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a')
      link.href = url; link.download = 'ecla-learning-data.json'; link.click(); URL.revokeObjectURL(url)
      setNotice('Your learning-data export has been downloaded.')
    } catch (reason) { setError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not export your data.')) }
    finally { setBusy(null) }
  }
  const deleteLearningData = async () => {
    if (learningConfirmation !== 'DELETE MY LEARNING DATA') return
    setBusy('learning-delete'); setNotice(null); setError(null)
    try {
      await apiFetch('/api/v1/privacy/learning-data', getToken, { method: 'DELETE', body: JSON.stringify({ confirmation: learningConfirmation }) })
      window.location.assign('/onboarding')
    } catch (reason) { setError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not delete your learning data.')); setBusy(null) }
  }
  const deleteAccount = async () => {
    if (accountConfirmation !== 'DELETE MY ACCOUNT') return
    setBusy('account-delete'); setNotice(null); setError(null)
    try {
      await apiFetch('/api/v1/privacy/account', getToken, { method: 'DELETE', body: JSON.stringify({ confirmation: accountConfirmation }) })
      try { await clerk.signOut({ redirectUrl: '/' }) } catch { window.location.assign('/') }
    } catch (reason) { setError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not delete your account.')); setBusy(null) }
  }

  if (!isLoaded || (isSignedIn && !account && !error)) return <AppShell><div className="flex min-h-[55vh] items-center justify-center" role="status"><div className="text-center"><span className="ecla-loading-mark mx-auto block text-ember-soft" /><p className="mt-4 text-sm text-stone">Opening your settings…</p></div></div></AppShell>
  if (!isSignedIn) return <AppShell><div className="mx-auto max-w-2xl py-16"><ApiState error={new ApiError('unauthorized', 'Please sign in to manage your account.', 401)} /></div></AppShell>

  return <AppShell><div className="mx-auto max-w-6xl pb-8">
    <header className="mb-8 border-b border-line pb-7 sm:mb-10 sm:pb-9"><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-ember-soft">Your Ecla</p><h1 className="font-display mt-3 text-4xl leading-none text-ivory sm:text-6xl">Profile &amp; settings</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-stone sm:text-base">Manage your identity, learning rhythm, appearance, privacy, and account security.</p></header>
    {error ? <div className="mb-6"><ApiState error={error} onRetry={error.retryable ? load : undefined} /></div> : null}
    {notice ? <p role="status" className="mb-6 flex items-start gap-2 rounded-control border border-success/30 bg-success/10 p-3 text-xs leading-5 text-success"><Check className="mt-0.5 size-3.5 shrink-0" />{notice}</p> : null}

    <Section title="Profile" description="The name and photo people see across your Ecla account."><div className="ecla-surface rounded-surface p-4 sm:p-6"><div className="flex min-w-0 items-center gap-4 border-b border-line pb-5">{user?.imageUrl ? <Image src={user.imageUrl} alt="" width={64} height={64} className="size-16 shrink-0 rounded-full object-cover" /> : <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-ember/15 text-ember-soft"><UserRound className="size-6" /></span>}<div className="min-w-0"><p className="truncate text-lg font-medium text-ivory">{displayName}</p><p className="truncate text-sm text-stone">{user?.primaryEmailAddress?.emailAddress ?? account?.email}</p><button type="button" onClick={() => clerk.openUserProfile()} className="ecla-control mt-2 inline-flex min-h-11 items-center gap-2 text-xs font-medium text-ember-soft hover:text-ivory">Photo, email &amp; security <ExternalLink className="size-3.5" /></button></div></div><form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-stone">First name<input value={firstName} onChange={event => setFirstName(event.target.value)} required maxLength={80} autoComplete="given-name" className="mt-2 min-h-12 w-full rounded-control border border-line bg-ink px-4 text-sm text-ivory outline-none focus:border-ember" /></label><label className="text-xs font-medium text-stone">Last name<input value={lastName} onChange={event => setLastName(event.target.value)} maxLength={80} autoComplete="family-name" className="mt-2 min-h-12 w-full rounded-control border border-line bg-ink px-4 text-sm text-ivory outline-none focus:border-ember" /></label><div className="sm:col-span-2 sm:text-right"><button disabled={busy !== null || !firstName.trim()} className="ecla-control min-h-12 rounded-control bg-ember px-5 text-sm font-semibold text-obsidian hover:bg-ember-soft">{busy === 'profile' ? 'Saving…' : 'Save profile'}</button></div></form></div></Section>

    <Section title="Appearance" description="Choose how Ecla looks on this device. Your choice applies immediately."><div className="grid gap-3 sm:grid-cols-3">{THEMES.map(item => { const Icon = item.icon; const selected = preference === item.id; return <button key={item.id} type="button" aria-pressed={selected} onClick={() => setPreference(item.id)} className={`ecla-control min-h-28 rounded-surface border p-4 text-left ${selected ? 'border-ember bg-ember/10' : 'border-line bg-surface hover:border-line-strong'}`}><span className="flex items-start justify-between"><Icon className={selected ? 'size-5 text-ember-soft' : 'size-5 text-stone'} />{selected ? <Check className="size-4 text-ember-soft" /> : null}</span><span className="mt-4 block text-sm font-medium text-ivory">{item.label}</span><span className="mt-1 block text-xs text-stone">{item.description}</span></button> })}</div></Section>

    <Section title="Learning rhythm" description="Adjust what brought you here and how much practice fits your day."><fieldset><legend className="text-[10px] font-semibold uppercase tracking-[.16em] text-ash">Why you are learning</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{MOTIVATIONS.map(item => { const Icon = item.icon; const selected = motivation === item.id; return <button type="button" key={item.id} aria-pressed={selected} onClick={() => setMotivation(item.id)} className={`ecla-control flex min-h-14 items-center gap-3 rounded-control border px-4 text-left text-sm ${selected ? 'border-ember bg-ember/10 text-ivory' : 'border-line bg-surface text-stone hover:border-line-strong'}`}><Icon className={`size-4 ${selected ? 'text-ember-soft' : ''}`} />{item.label}{selected ? <Check className="ml-auto size-4 text-ember-soft" /> : null}</button> })}</div></fieldset><fieldset className="mt-6"><legend className="text-[10px] font-semibold uppercase tracking-[.16em] text-ash">Daily pace</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{PACES.map(item => { const selected = dailyGoalXp === item.id; return <button type="button" key={item.id} aria-pressed={selected} onClick={() => setDailyGoalXp(item.id)} className={`ecla-control min-h-24 rounded-control border p-4 text-left ${selected ? 'border-ember bg-ember/10' : 'border-line bg-surface hover:border-line-strong'}`}><Clock3 className={`size-4 ${selected ? 'text-ember-soft' : 'text-stone'}`} /><span className="mt-3 block text-sm font-medium text-ivory">{item.label}</span><span className="mt-1 block text-xs text-stone">{item.detail}</span></button> })}</div></fieldset><div className="mt-5 text-right"><button type="button" onClick={saveLearning} disabled={busy !== null || !motivation} className="ecla-control min-h-12 rounded-control bg-ember px-5 text-sm font-semibold text-obsidian hover:bg-ember-soft">{busy === 'learning' ? 'Saving…' : 'Save learning preferences'}</button></div></Section>

    <Section title="Privacy & data" description="Download your record or reset learning evidence while keeping your identity."><div className="space-y-3"><div className="flex flex-col gap-4 rounded-surface border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-ivory">Export learning data</p><p className="mt-1 text-xs leading-5 text-stone">Download your profile, progress, attempts, reviews, and assessment record as JSON.</p></div><button type="button" onClick={exportData} disabled={busy !== null} className="ecla-control inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control border border-line-strong px-4 text-sm text-ivory hover:bg-surface-raised"><ArrowDownToLine className="size-4" />{busy === 'export' ? 'Preparing…' : 'Download'}</button></div><details className="rounded-surface border border-danger/25 bg-danger/[.04] p-4"><summary className="ecla-control cursor-pointer list-none text-sm font-medium text-danger">Delete learning data</summary><p className="mt-3 text-xs leading-5 text-stone">This permanently removes your progress, attempts, memories, reviews, and assessment record. Your sign-in stays active and onboarding starts again.</p><label className="mt-4 block text-xs text-stone">Type <strong className="text-ivory">DELETE MY LEARNING DATA</strong><input value={learningConfirmation} onChange={event => setLearningConfirmation(event.target.value)} autoComplete="off" className="mt-2 min-h-12 w-full rounded-control border border-danger/30 bg-ink px-4 text-sm text-ivory outline-none focus:border-danger" /></label><button type="button" onClick={deleteLearningData} disabled={busy !== null || learningConfirmation !== 'DELETE MY LEARNING DATA'} className="ecla-control mt-3 inline-flex min-h-11 items-center gap-2 rounded-control bg-danger px-4 text-sm font-semibold text-white"><Trash2 className="size-4" />{busy === 'learning-delete' ? 'Deleting…' : 'Delete learning data'}</button></details></div></Section>

    <Section title="Account" description="Manage security, sign out, or permanently close your Ecla account."><div className="space-y-3"><button type="button" onClick={() => clerk.openUserProfile()} className="ecla-control flex min-h-14 w-full items-center gap-3 rounded-control border border-line bg-surface px-4 text-left text-sm text-ivory hover:border-line-strong"><Shield className="size-4 text-ember-soft" />Password, passkeys &amp; connected accounts<ExternalLink className="ml-auto size-4 text-stone" /></button><button type="button" onClick={() => clerk.signOut({ redirectUrl: '/' })} className="ecla-control flex min-h-14 w-full items-center gap-3 rounded-control border border-line bg-surface px-4 text-left text-sm text-ivory hover:border-line-strong"><LogOut className="size-4 text-stone" />Sign out</button><details className="rounded-surface border border-danger/30 bg-danger/[.04] p-4"><summary className="ecla-control cursor-pointer list-none text-sm font-medium text-danger">Delete account permanently</summary><p className="mt-3 text-xs leading-5 text-stone">This deletes your Ecla identity and all associated learning data. It cannot be undone.</p><label className="mt-4 block text-xs text-stone">Type <strong className="text-ivory">DELETE MY ACCOUNT</strong><input value={accountConfirmation} onChange={event => setAccountConfirmation(event.target.value)} autoComplete="off" className="mt-2 min-h-12 w-full rounded-control border border-danger/30 bg-ink px-4 text-sm text-ivory outline-none focus:border-danger" /></label><button type="button" onClick={deleteAccount} disabled={busy !== null || accountConfirmation !== 'DELETE MY ACCOUNT'} className="ecla-control mt-3 inline-flex min-h-11 items-center gap-2 rounded-control bg-danger px-4 text-sm font-semibold text-white"><Trash2 className="size-4" />{busy === 'account-delete' ? 'Deleting account…' : 'Delete my account'}</button></details></div></Section>
  </div></AppShell>
}
