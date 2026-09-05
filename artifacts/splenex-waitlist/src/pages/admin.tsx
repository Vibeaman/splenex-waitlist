import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, Download, RefreshCw, Search, Users, X } from 'lucide-react';
import { useGetWaitlistSummary, useListWaitlistEntries } from '@workspace/api-client-react';
import { getGetWaitlistSummaryQueryKey, getListWaitlistEntriesQueryKey } from '@workspace/api-client-react';
import type { WaitlistEntry } from '@workspace/api-client-react';
import { PageFrame, SectionEyebrow } from '@/components/splenex-shell';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function MetricCard({ label, value, note, accent = false }: { label: string; value: string | number; note: string; accent?: boolean }) {
  return <div className={`border p-5 sm:p-6 ${accent ? 'border-primary/60 bg-primary/[0.035]' : 'border-border bg-card/30'}`} data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}><p className="mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className={`mt-5 text-4xl font-medium tracking-[-0.06em] ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p><p className="mt-2 text-xs text-muted-foreground">{note}</p></div>;
}

function SkeletonRows() {
  return <div className="divide-y divide-border border border-border" aria-label="Loading entries">{[1, 2, 3, 4].map((item) => <div className="flex animate-pulse items-center gap-4 px-5 py-5" key={item}><div className="h-3 w-7 bg-muted" /><div className="h-3 w-32 bg-muted" /><div className="h-3 flex-1 bg-muted" /><div className="h-3 w-24 bg-muted" /></div>)}</div>;
}

function EntryRow({ entry }: { entry: WaitlistEntry }) {
  return <div className="grid grid-cols-[36px_1fr] gap-3 px-4 py-5 sm:grid-cols-[46px_1fr_1fr_1.1fr_120px_150px] sm:items-center sm:gap-4 sm:px-5" data-testid={`row-entry-${entry.id}`}>
    <span className="mono text-[10px] text-muted-foreground">#{String(entry.id).padStart(3, '0')}</span>
    <div className="min-w-0"><p className="truncate text-sm text-foreground">@{entry.twitterUsername}</p><p className="mono mt-1 text-[10px] text-muted-foreground sm:hidden">{entry.email}</p></div>
    <p className="hidden truncate text-sm text-foreground sm:block">@{entry.telegramUsername}</p>
    <p className="hidden truncate text-sm text-muted-foreground sm:block">{entry.email}</p>
    <div className="hidden items-center gap-2 sm:flex"><span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] ${entry.xFollowed ? 'text-primary' : 'text-muted-foreground'}`}>{entry.xFollowed ? <Check size={12} /> : <X size={12} />} X</span><span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] ${entry.telegramJoined ? 'text-primary' : 'text-muted-foreground'}`}>{entry.telegramJoined ? <Check size={12} /> : <X size={12} />} TG</span></div>
    <span className="mono col-start-2 text-[10px] text-muted-foreground sm:col-auto sm:text-right">{formatDate(entry.createdAt)}</span>
  </div>;
}

export default function Admin() {
  const [search, setSearch] = useState('');
  const [showExportNote, setShowExportNote] = useState(false);
  const params = useMemo(() => ({ limit: 100, ...(search.trim() ? { search: search.trim() } : {}) }), [search]);
  const entriesQuery = useListWaitlistEntries(params, { query: { queryKey: getListWaitlistEntriesQueryKey(params), staleTime: 30_000 } });
  const summaryQuery = useGetWaitlistSummary({ query: { queryKey: getGetWaitlistSummaryQueryKey(), staleTime: 30_000 } });
  const entries = entriesQuery.data ?? [];
  const summary = summaryQuery.data;

  useEffect(() => {
    document.title = 'Splenex — Waitlist operations';
  }, []);

  const refresh = () => {
    void entriesQuery.refetch();
    void summaryQuery.refetch();
  };

  const exportEntries = () => {
    if (!entries.length) {
      setShowExportNote(true);
      return;
    }
    const header = 'id,email,twitterUsername,telegramUsername,xFollowed,telegramJoined,createdAt';
    const rows = entries.map((entry) => [entry.id, entry.email, entry.twitterUsername, entry.telegramUsername, entry.xFollowed, entry.telegramJoined, entry.createdAt].map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `splenex-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const queryError = entriesQuery.isError ? entriesQuery.error : summaryQuery.isError ? summaryQuery.error : null;

  return <PageFrame admin>
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-9 sm:flex-row sm:items-end">
        <div><SectionEyebrow icon={<Users size={13} />}>Operations / Waitlist</SectionEyebrow><h1 className="mt-5 text-4xl font-medium tracking-[-0.06em] sm:text-6xl">People in the room.</h1><p className="mt-4 max-w-[46ch] text-sm leading-6 text-muted-foreground">A quiet view of the first Splenex cohort. Review the signal, not the noise.</p></div>
        <div className="flex items-center gap-3"><button onClick={refresh} className="focus-ring inline-flex items-center gap-2 border border-border px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground" data-testid="button-refresh"><RefreshCw size={14} className={entriesQuery.isFetching || summaryQuery.isFetching ? 'animate-spin' : ''} /> Refresh</button><button onClick={exportEntries} className="focus-ring inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-export"><Download size={14} /> Export CSV</button></div>
      </div>
      {showExportNote && <div className="mt-5 flex items-center justify-between border border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground" data-testid="status-export-empty">There are no entries to export yet.<button onClick={() => setShowExportNote(false)} aria-label="Dismiss export note" className="focus-ring p-1 text-muted-foreground hover:text-foreground" data-testid="button-dismiss-export"><X size={14} /></button></div>}
      {queryError && <div className="mt-7 flex items-start gap-3 border border-destructive/50 bg-destructive/[0.05] p-4 text-sm" data-testid="status-admin-error"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-destructive" /><div><p className="text-foreground">Couldn’t load waitlist activity.</p><p className="mt-1 text-xs text-muted-foreground">The internal feed may be unavailable. Try refreshing when ready.</p><button onClick={refresh} className="focus-ring mt-3 text-xs text-primary underline underline-offset-4" data-testid="button-retry-admin">Retry request</button></div></div>}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total members" value={summaryQuery.isLoading ? '—' : summary?.total ?? 0} note="All submitted requests" accent />
         <MetricCard label="Joined today" value={summaryQuery.isLoading ? '—' : summary?.joinedToday ?? 0} note="Fresh since midnight" />
        <MetricCard label="X completion" value={summaryQuery.isLoading ? '—' : summary?.xCompleted ?? 0} note="Confirmed at submission" />
        <MetricCard label="Telegram completion" value={summaryQuery.isLoading ? '—' : summary?.telegramCompleted ?? 0} note="Confirmed at submission" />
      </section>
      <section className="mt-12">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Recent submissions</p><p className="mt-2 text-sm text-foreground">{entries.length ? `${entries.length} visible ${entries.length === 100 ? '· capped at 100' : ''}` : 'No activity yet'}</p></div><label className="flex w-full max-w-xs items-center gap-3 border-b border-input px-1 py-2 focus-within:border-primary"><Search size={15} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search email or username" className="focus-ring w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-search-entries" /></label></div>
        {entriesQuery.isLoading ? <SkeletonRows /> : entries.length ? <div className="border border-border bg-card/20"><div className="hidden grid-cols-[46px_1fr_1fr_1.1fr_120px_150px] gap-4 border-b border-border px-5 py-3 sm:grid"><span className="mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">ID</span><span className="mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">X identity</span><span className="mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Telegram</span><span className="mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Email</span><span className="mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Checks</span><span className="mono text-right text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Received</span></div><div className="divide-y divide-border">{entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)}</div></div> : <div className="border border-dashed border-border px-6 py-16 text-center" data-testid="status-admin-empty"><div className="mx-auto grid h-10 w-10 place-items-center border border-border text-muted-foreground"><ChevronDown size={16} /></div><p className="mt-5 text-sm text-foreground">{search ? 'No matching members.' : 'The room is still empty.'}</p><p className="mx-auto mt-2 max-w-[35ch] text-xs leading-5 text-muted-foreground">{search ? 'Try a different email, X username, or Telegram username.' : 'Once the first signal comes through, members will appear here.'}</p></div>}
      </section>
    </main>
  </PageFrame>;
}