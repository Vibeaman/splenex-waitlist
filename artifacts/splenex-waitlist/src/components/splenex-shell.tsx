import { Activity, ArrowUpRight, LockKeyhole, Radio, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import type { ReactNode } from 'react';

export function SplenexMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-2" data-testid="link-home">
      <span className="grid h-7 w-7 place-items-center border border-primary/70 text-[11px] font-bold text-primary" aria-hidden="true">S</span>
      {!compact && <span className="text-[15px] font-semibold tracking-[-0.04em] text-foreground">SPLENEX</span>}
    </Link>
  );
}

export function Topbar({ admin = false }: { admin?: boolean }) {
  const [location] = useLocation();
  return (
    <header className="relative z-10 flex items-center justify-between border-b border-border px-5 py-4 sm:px-8 lg:px-12">
      <SplenexMark />
      <div className="flex items-center gap-4 sm:gap-7">
        <span className="mono hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
          {admin ? 'Internal / live' : 'Intelligence, focused'}
        </span>
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary" data-testid="status-system">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Online
        </span>
        {location !== '/admin' ? (
          <Link href="/admin" className="focus-ring mono inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground" data-testid="link-admin">
            Admin <ArrowUpRight size={13} strokeWidth={1.5} />
          </Link>
        ) : (
          <Link href="/" className="focus-ring mono inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground" data-testid="link-public">
            Public <ArrowUpRight size={13} strokeWidth={1.5} />
          </Link>
        )}
      </div>
    </header>
  );
}

export function PageFrame({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  return (
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      <Topbar admin={admin} />
      {children}
      <footer className="mx-5 flex flex-col gap-3 border-t border-border py-7 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:mx-8 sm:flex-row sm:items-center sm:justify-between lg:mx-12">
        <span className="mono">© {new Date().getFullYear()} Splenex</span>
        <span className="flex items-center gap-2"><ShieldCheck size={13} className="text-primary" /> Early access is curated</span>
      </footer>
    </div>
  );
}

export function SectionEyebrow({ children, icon = <Radio size={13} /> }: { children: ReactNode; icon?: ReactNode }) {
  return <div className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-primary">{icon}{children}</div>;
}

export function LockedLabel() {
  return <span className="mono inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><LockKeyhole size={12} /> Locked until verified</span>;
}

export function TinyActivity({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-border py-3 last:border-0"><span className="mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{label}</span><span className="mono text-xs text-foreground">{value}</span></div>;
}

export function ActivityIcon() {
  return <Activity size={15} strokeWidth={1.5} className="text-primary" />;
}