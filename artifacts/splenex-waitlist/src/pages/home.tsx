import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Check, Circle, ExternalLink, Mail, Send, UserRound, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetWaitlistSummaryQueryKey, getListWaitlistEntriesQueryKey, useCreateWaitlistEntry } from '@workspace/api-client-react';
import type { WaitlistEntryInput } from '@workspace/api-client-react';
import { PageFrame, SectionEyebrow, LockedLabel } from '@/components/splenex-shell';

const X_DESTINATION = 'https://x.com/Splenex';
const TELEGRAM_DESTINATION = 'https://t.me/Splenex_portal';
const TELEGRAM_CHAT_DESTINATION = 'https://t.me/+372iEfRamh8yZjRk';

type TaskKey = 'x' | 'telegram';

function errorText(error: unknown) {
  if (!error) return '';
  if (typeof error === 'object' && error !== null && 'error' in error) return String((error as { error: unknown }).error);
  if (error instanceof Error) return error.message;
  return 'Something interrupted the request. Please try again.';
}

function TaskField({ task, step, visited, complete, onVisit, onConfirm }: {
  task: TaskKey;
  step: string;
  visited: boolean;
  complete: boolean;
  onVisit: () => void;
  onConfirm: () => void;
}) {
  const isX = task === 'x';
  return (
    <div className={`flex flex-col gap-4 border p-5 transition-colors duration-300 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${complete ? 'border-primary/70 bg-primary/[0.04]' : 'border-border bg-card/30'}`} data-testid={`field-task-${task}`}>
      <div className="flex items-start gap-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center border ${complete ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground'}`} aria-hidden="true">
          {isX ? <X size={18} strokeWidth={1.7} /> : <Send size={17} strokeWidth={1.7} />}
        </span>
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Step {step}</p>
          <label htmlFor={`task-${task}`} className="mt-1 block text-lg font-medium tracking-[-0.03em] text-foreground">{isX ? 'Follow @Splenex on X' : 'Join the Telegram channel'}</label>
          <p className="mt-1 max-w-[42ch] text-sm leading-6 text-muted-foreground">{isX ? 'Follow for research notes, product drops, and the first read.' : 'Quiet room, high-signal conversation. Join before you continue.'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border pt-4 sm:flex-col sm:items-end sm:gap-3 sm:border-t-0 sm:pt-0">
        <a
          href={isX ? X_DESTINATION : TELEGRAM_DESTINATION}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onVisit}
          className="focus-ring mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-primary transition-colors hover:text-accent"
          data-testid={`link-task-${task}`}
        >
          Open {isX ? 'X' : 'Telegram'} <ExternalLink size={13} strokeWidth={1.5} />
        </a>
        <label htmlFor={`task-${task}`} className={`flex cursor-pointer items-center gap-2 text-[10px] uppercase tracking-[0.1em] ${visited ? 'text-foreground' : 'cursor-not-allowed text-muted-foreground/50'}`}>
          <input id={`task-${task}`} name={`task-${task}`} type="checkbox" checked={complete} onChange={onConfirm} disabled={!visited || complete} className="sr-only" data-testid={`checkbox-task-${task}`} />
          <span className={`grid h-4 w-4 place-items-center border transition-colors ${complete ? 'border-primary bg-primary text-primary-foreground' : visited ? 'border-muted-foreground' : 'border-border'}`}>{complete && <Check size={11} strokeWidth={3} />}</span>
          {complete ? 'Confirmed' : 'Confirm'}
        </label>
      </div>
    </div>
  );
}

export default function Home() {
  const queryClient = useQueryClient();
  const [visited, setVisited] = useState<Record<TaskKey, boolean>>({ x: false, telegram: false });
  const [confirmed, setConfirmed] = useState<Record<TaskKey, boolean>>({ x: false, telegram: false });
  const [form, setForm] = useState({ twitterUsername: '', telegramUsername: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const createEntry = useCreateWaitlistEntry();

  useEffect(() => {
    document.title = 'Splenex — Early access';
  }, []);

  const unlocked = confirmed.x && confirmed.telegram;
  const formReady = unlocked
    && form.twitterUsername.trim().length >= 2
    && form.telegramUsername.trim().length >= 2
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const progress = useMemo(() => (Number(visited.x) + Number(visited.telegram) + Number(confirmed.x) + Number(confirmed.telegram)) / 4, [visited, confirmed]);

  const markVisited = (task: TaskKey) => setVisited((current) => ({ ...current, [task]: true }));
  const markConfirmed = (task: TaskKey) => setConfirmed((current) => ({ ...current, [task]: true }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError('');
    if (!unlocked) {
      setFieldError('Complete both access checks before joining.');
      return;
    }
    if (form.twitterUsername.trim().length < 2) {
      setFieldError('Enter your X username.');
      return;
    }
    if (form.telegramUsername.trim().length < 2) {
      setFieldError('Enter your Telegram username.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFieldError('Enter a valid email address.');
      return;
    }
    const payload: WaitlistEntryInput = {
      email: form.email.trim(),
      twitterUsername: form.twitterUsername.trim().replace(/^@/, ''),
      telegramUsername: form.telegramUsername.trim().replace(/^@/, ''),
      xFollowed: confirmed.x,
      telegramJoined: confirmed.telegram,
    };
    createEntry.mutate({ data: payload }, {
      onSuccess: () => {
        setSubmitted(true);
        void queryClient.invalidateQueries({ queryKey: getListWaitlistEntriesQueryKey({ limit: 100 }) });
        void queryClient.invalidateQueries({ queryKey: getGetWaitlistSummaryQueryKey() });
      },
    });
  };

  if (submitted) {
    return (
      <PageFrame>
        <main className="mx-auto flex min-h-[calc(100dvh-130px)] max-w-5xl items-center px-5 py-14 sm:px-8 lg:px-12">
          <section className="w-full border border-primary/50 bg-primary/[0.035] p-7 sm:p-12 lg:p-16 animate-stamp" data-testid="status-success">
            <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SectionEyebrow icon={<Check size={13} />}>Access request received</SectionEyebrow>
                <h1 className="mt-7 max-w-[11ch] text-5xl font-semibold leading-[0.95] tracking-[-0.065em] sm:text-7xl">You’re on the inside track.</h1>
                <p className="mt-7 max-w-[49ch] text-base leading-7 text-muted-foreground">We’ll use the email you shared for the first dispatch. Keep an eye on the channel, the next signal won’t be broadcast twice.</p>
              </div>
              <div className="shrink-0 border-l border-primary/40 pl-5 sm:mt-8">
                <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Status</span>
                <p className="mt-2 flex items-center gap-2 text-sm text-primary"><span className="h-2 w-2 rounded-full bg-primary" />Queued for review</p>
              </div>
            </div>
            <div className="mt-12 flex flex-wrap gap-3 border-t border-border pt-5">
              <a href={TELEGRAM_CHAT_DESTINATION} target="_blank" rel="noopener noreferrer" className="focus-ring button-signal inline-flex items-center gap-3 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground" data-testid="link-success-telegram">Continue in Telegram <ArrowRight size={16} /></a>
              <a href={X_DESTINATION} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-3 border border-border px-5 py-3 text-sm text-foreground transition-colors hover:border-muted-foreground" data-testid="link-success-x">Read the latest on X <ArrowRight size={16} /></a>
            </div>
          </section>
        </main>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <main>
        <section className="signal-grid relative overflow-hidden border-b border-border px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:px-12 lg:pt-28">
          <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div className="animate-rise">
              <SectionEyebrow>Private beta / 001</SectionEyebrow>
              <h1 className="mt-7 max-w-[10ch] text-[clamp(3.4rem,8vw,7.8rem)] font-semibold leading-[0.88] tracking-[-0.075em]">Read the market <span className="text-primary">before it moves.</span></h1>
              <p className="mt-8 max-w-[38rem] text-base leading-7 text-muted-foreground sm:text-lg">Splenex is building a sharper way to navigate crypto intelligence. We’re opening the first room to a small group of people who look beyond the noise.</p>
            </div>
            <div className="animate-rise delay-2 border-l border-primary/50 pl-5 sm:pl-7">
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">The first cohort</p>
              <p className="mt-4 text-2xl font-medium leading-tight tracking-[-0.045em] text-foreground">Signal over spectacle.<br />Context over calls.</p>
              <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px w-10 bg-primary" />Limited early access</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="flex flex-col justify-between gap-6 border-b border-border pb-9 sm:flex-row sm:items-end">
            <div>
              <SectionEyebrow icon={<UserRound size={13} />}>Request access</SectionEyebrow>
              <h2 className="mt-5 max-w-[16ch] text-3xl font-medium leading-tight tracking-[-0.05em] sm:text-4xl">One form. Three steps. One doorway.</h2>
              <p className="mt-5 max-w-[52ch] text-sm leading-6 text-muted-foreground">Follow the project, enter the conversation, then leave your coordinates for the invite.</p>
            </div>
            <div className="flex w-full max-w-[220px] items-center gap-3"><div className="h-1 flex-1 bg-muted"><div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${Math.max(8, progress * 100)}%` }} /></div><span className="mono text-[10px] text-muted-foreground">{unlocked ? 'OPEN' : `${Math.round(progress * 100)}%`}</span></div>
          </div>

          <form onSubmit={submit} className="mt-10 grid gap-10" data-testid="form-waitlist">
            <fieldset className="grid gap-4">
              <legend className="mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary"><span className="grid h-5 w-5 place-items-center border border-primary/60 text-[10px]">1</span>Establish access</legend>
              <TaskField task="x" step="01" visited={visited.x} complete={confirmed.x} onVisit={() => markVisited('x')} onConfirm={() => markConfirmed('x')} />
              <TaskField task="telegram" step="02" visited={visited.telegram} complete={confirmed.telegram} onVisit={() => markVisited('telegram')} onConfirm={() => markConfirmed('telegram')} />
              {!unlocked && <div className="pt-1"><LockedLabel /></div>}
            </fieldset>

            <fieldset className={`grid gap-5 border-t border-border pt-8 transition-opacity duration-500 ${unlocked ? 'opacity-100' : 'opacity-55'}`}>
              <legend className="mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary"><span className="grid h-5 w-5 place-items-center border border-primary/60 text-[10px]">2</span>Leave your coordinates</legend>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block" htmlFor="input-twitter-username">
                  <span className="mono mb-2 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">X username</span>
                  <div className="flex items-center border-b border-input transition-colors focus-within:border-primary">
                    <span className="mono text-sm text-muted-foreground">@</span>
                    <input id="input-twitter-username" name="twitterUsername" value={form.twitterUsername} onChange={(e) => setForm((current) => ({ ...current, twitterUsername: e.target.value }))} disabled={!unlocked || createEntry.isPending} className="focus-ring w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50" placeholder="yourhandle" data-testid="input-twitter-username" />
                  </div>
                </label>
                <label className="block" htmlFor="input-telegram-username">
                  <span className="mono mb-2 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Telegram username</span>
                  <div className="flex items-center border-b border-input transition-colors focus-within:border-primary">
                    <span className="mono text-sm text-muted-foreground">@</span>
                    <input id="input-telegram-username" name="telegramUsername" value={form.telegramUsername} onChange={(e) => setForm((current) => ({ ...current, telegramUsername: e.target.value }))} disabled={!unlocked || createEntry.isPending} className="focus-ring w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50" placeholder="yourhandle" data-testid="input-telegram-username" />
                  </div>
                </label>
                <label className="block" htmlFor="input-email">
                  <span className="mono mb-2 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Email address</span>
                  <div className="flex items-center border-b border-input transition-colors focus-within:border-primary">
                    <Mail size={15} className="text-muted-foreground" />
                    <input id="input-email" name="email" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} disabled={!unlocked || createEntry.isPending} className="focus-ring w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50" placeholder="you@domain.com" data-testid="input-email" />
                  </div>
                </label>
              </div>
              <div className="flex flex-col items-start justify-between gap-5 border-t border-border pt-5 sm:flex-row sm:items-center">
                <div className="text-xs text-muted-foreground">
                  {!unlocked ? <LockedLabel /> : <span className="flex items-center gap-2 text-primary"><Check size={14} /> Access verified. You may continue.</span>}
                  {fieldError && <p className="mt-2 text-destructive" data-testid="status-form-error">{fieldError}</p>}
                  {createEntry.isError && <p className="mt-2 max-w-md text-destructive" data-testid="status-submit-error">{errorText(createEntry.error).toLowerCase().includes('already') ? 'That email, X username, or Telegram username is already on the list.' : errorText(createEntry.error)}</p>}
                </div>
                <button type="submit" disabled={!formReady || createEntry.isPending} className="focus-ring button-signal inline-flex w-full items-center justify-center gap-3 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground sm:w-auto" data-testid="button-submit-waitlist">{createEntry.isPending ? 'Securing your place…' : 'Request access'} <ArrowRight size={16} /></button>
              </div>
            </fieldset>
          </form>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-3 lg:px-12">
          {['A considered read on volatile markets.', 'Research that respects your attention.', 'A private channel for the early signal.'].map((text, index) => <div key={text} className="border-t border-border pt-4"><span className="mono text-[10px] text-primary">0{index + 1}</span><p className="mt-4 max-w-[18ch] text-lg leading-6 tracking-[-0.03em] text-foreground">{text}</p></div>)}
        </section>
      </main>
    </PageFrame>
  );
}
