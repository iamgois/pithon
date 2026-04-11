"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeadRow {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  origemCodigo: string | null;
  intencaoApoio: string;
  tipo: "lead";
  createdAt: string;
  indicadoPor: { nome: string; codigoIndicacao: string } | null;
}

interface ApoiadorRow {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  codigoIndicacao: string;
  origemCodigo: string | null;
  intencaoApoio: string;
  tipo: "apoiador";
  createdAt: string;
  indicadoPor: { nome: string; codigoIndicacao: string } | null;
}

interface StatsData {
  totalLeads: number;
  totalApoiadores: number;
  intencaoApoio: { sim: number; nao: number; indeciso: number };
  leads: LeadRow[];
  apoiadores: ApoiadorRow[];
}

type AnyRow = LeadRow | ApoiadorRow;

const PER_PAGE = 10;

// Phases: [transition_ms, pause_ms, count]
const PHASES: [number, number, number][] = [
  [55,  5,  22],  // blazing fast
  [90,  8,  14],  // fast
  [160, 15, 10],  // medium
  [280, 20,  8],  // slowing
  [420, 25,  6],  // slow
  [600, 30,  4],  // very slow
  [800, 35,  3],  // crawling
];
const ITEM_H = 68; // px per reel slot
const VISIBLE = 5; // visible slots (must be odd)
const CENTER = Math.floor(VISIBLE / 2); // = 2

function getApoioBadgeVariant(voto: string): "default" | "secondary" | "destructive" {
  if (voto === "sim") return "default";
  if (voto === "nao") return "destructive";
  return "secondary";
}
function getApoioLabel(voto: string) {
  if (voto === "sim") return "Sim";
  if (voto === "nao") return "Não";
  return "Indeciso";
}
function esc(v: string | null | undefined) {
  if (!v) return "";
  return `"${v.replace(/"/g, '""')}"`;
}
function downloadLeadsCSV(leads: LeadRow[]) {
  const h = ["Nome","Email","Telefone","Intenção de Apoio","Indicado por","Código de origem","Data"];
  const r = leads.map(l => [esc(l.nome),esc(l.email),esc(l.telefone),getApoioLabel(l.intencaoApoio),esc(l.indicadoPor?.nome),esc(l.origemCodigo),new Date(l.createdAt).toLocaleDateString("pt-BR")]);
  const csv = [h.join(","),...r.map(x=>x.join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
  const a = Object.assign(document.createElement("a"),{href:url,download:`leads-pithon-${new Date().toISOString().split("T")[0]}.csv`});
  a.click(); URL.revokeObjectURL(url);
}
function downloadApoiadoresCSV(apoiadores: ApoiadorRow[]) {
  const h = ["Nome","Email","Telefone","Código","Indicado por","Data"];
  const r = apoiadores.map(a => [esc(a.nome),esc(a.email),esc(a.telefone),esc(a.codigoIndicacao),esc(a.indicadoPor?.nome),new Date(a.createdAt).toLocaleDateString("pt-BR")]);
  const csv = [h.join(","),...r.map(x=>x.join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
  const a = Object.assign(document.createElement("a"),{href:url,download:`apoiadores-pithon-${new Date().toISOString().split("T")[0]}.csv`});
  a.click(); URL.revokeObjectURL(url);
}

function Pagination({ page, total, onPrev, onNext, loading }: {
  page: number; total: number; onPrev: () => void; onNext: () => void; loading: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-xs text-muted-foreground">Página {page} de {totalPages} · {total} registro(s)</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={onPrev}>← Anterior</Button>
        <Button size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={onNext}>Próxima →</Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SLOT MACHINE MODAL
═══════════════════════════════════════════════ */
function SorteioModal({ title, lista, onClose }: {
  title: string; lista: AnyRow[]; onClose: () => void;
}) {
  // Reel contains VISIBLE+1 items; extra item at bottom slides in each tick
  const initReel = useCallback(() =>
    Array.from({ length: VISIBLE + 1 }, (_, i) => lista[i % lista.length]?.nome ?? "—"),
  [lista]);

  const [reelItems, setReelItems] = useState<string[]>(initReel);
  const [winner, setWinner] = useState<AnyRow | null>(null);
  const [running, setRunning] = useState(false);
  const [flash, setFlash] = useState(false);

  const innerRef  = useRef<HTMLDivElement>(null);
  const aliveRef  = useRef(true);   // unmount guard
  const runRef    = useRef(false);

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; runRef.current = false; };
  }, []);

  function pickRandom(exclude?: string) {
    if (lista.length === 1) return lista[0].nome;
    let n: string;
    do { n = lista[Math.floor(Math.random() * lista.length)].nome; }
    while (n === exclude);
    return n;
  }

  // One reel tick: slide up → snap back → update items → schedule next
  function tick(
    step: number,
    totalSteps: number,
    winnerIdx: number,
    phaseIdx: number,
    phaseStep: number,
  ) {
    if (!aliveRef.current || !runRef.current) return;

    // Determine this tick's timing
    const [transDur, pauseDur] = PHASES[phaseIdx];
    const isLast = step === totalSteps - 1;
    const nextName = isLast ? lista[winnerIdx].nome : pickRandom();

    const el = innerRef.current;
    if (el) {
      el.style.transition = `transform ${transDur}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      el.style.transform  = `translateY(-${ITEM_H}px)`;
    }

    setTimeout(() => {
      if (!aliveRef.current) return;

      // Snap back instantly (no transition) then update list
      if (el) {
        el.style.transition = "none";
        el.style.transform  = "translateY(0)";
      }
      setReelItems(prev => [...prev.slice(1), nextName]);

      if (isLast) {
        runRef.current = false;
        setRunning(false);
        // Small delay so last snap renders before revealing winner
        setTimeout(() => {
          if (!aliveRef.current) return;
          setWinner(lista[winnerIdx]);
          setFlash(true);
          setTimeout(() => setFlash(false), 900);
        }, 60);
        return;
      }

      // Advance to next phase if needed
      let nextPhaseIdx = phaseIdx;
      let nextPhaseStep = phaseStep + 1;
      if (nextPhaseStep >= PHASES[phaseIdx][2]) {
        nextPhaseIdx = Math.min(phaseIdx + 1, PHASES.length - 1);
        nextPhaseStep = 0;
      }

      setTimeout(
        () => tick(step + 1, totalSteps, winnerIdx, nextPhaseIdx, nextPhaseStep),
        pauseDur,
      );
    }, transDur);
  }

  function startSorteio() {
    if (lista.length === 0 || runRef.current) return;
    runRef.current = true;
    setRunning(true);
    setWinner(null);
    setFlash(false);
    setReelItems(initReel());

    // Reset reel position
    if (innerRef.current) {
      innerRef.current.style.transition = "none";
      innerRef.current.style.transform  = "translateY(0)";
    }

    const winnerIdx  = Math.floor(Math.random() * lista.length);
    const totalSteps = PHASES.reduce((s, [,, c]) => s + c, 0);

    setTimeout(() => tick(0, totalSteps, winnerIdx, 0, 0), 80);
  }

  function resetSorteio() {
    runRef.current = false;
    setRunning(false);
    setWinner(null);
    setFlash(false);
    setReelItems(initReel());
    if (innerRef.current) {
      innerRef.current.style.transition = "none";
      innerRef.current.style.transform  = "translateY(0)";
    }
  }

  const isWon = !!winner && !running;

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @keyframes slot-flash {
          0%   { box-shadow: 0 0 0 0 rgba(234,179,8,0.9), inset 0 0 0 2px rgba(234,179,8,0.9); }
          30%  { box-shadow: 0 0 32px 8px rgba(234,179,8,0.6), inset 0 0 0 2px rgba(234,179,8,1); }
          60%  { box-shadow: 0 0 20px 4px rgba(234,179,8,0.4), inset 0 0 0 2px rgba(234,179,8,0.8); }
          100% { box-shadow: 0 0 0 0 rgba(234,179,8,0), inset 0 0 0 2px rgba(34,197,94,0.8); }
        }
        @keyframes winner-pulse {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(34,197,94,0.5), inset 0 0 0 2px rgba(34,197,94,0.8); }
          50%       { box-shadow: 0 0 24px 6px rgba(34,197,94,0.7), inset 0 0 0 2px rgba(34,197,94,1); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        .slot-flash   { animation: slot-flash 0.9s ease-out forwards; }
        .winner-pulse { animation: winner-pulse 2s ease-in-out infinite; }
        .badge-pop    { animation: badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        onClick={e => { if (e.target === e.currentTarget && !running) onClose(); }}
      >
        {/* Panel */}
        <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">{lista.length} participante(s)</p>
            </div>
            <button
              onClick={() => { if (!running) onClose(); }}
              disabled={running}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors text-xl leading-none"
            >✕</button>
          </div>

          {/* ── Slot Machine ── */}
          <div className="px-6 pt-6 pb-4 shrink-0">
            {/* Machine body */}
            <div className="rounded-2xl border-2 border-border bg-muted/20 p-4 pb-5 shadow-inner">

              {/* Label */}
              <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
                🎰 Sorteio
              </p>

              {/* Reel window */}
              <div
                className="relative mx-auto rounded-xl overflow-hidden border border-border/60"
                style={{ height: VISIBLE * ITEM_H }}
              >
                {/* Dark bg */}
                <div className="absolute inset-0 bg-black/80" />

                {/* Center highlight window */}
                <div
                  className={[
                    "absolute inset-x-0 z-10 rounded-sm transition-all duration-300",
                    flash   ? "slot-flash"
                    : isWon ? "winner-pulse"
                    :         "border-y border-yellow-500/40",
                  ].join(" ")}
                  style={{ top: CENTER * ITEM_H, height: ITEM_H }}
                />

                {/* Gradient masks — simulate reel barrel curvature */}
                <div
                  className="absolute inset-x-0 top-0 z-20 pointer-events-none"
                  style={{
                    height: ITEM_H * 2.2,
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)",
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
                  style={{
                    height: ITEM_H * 2.2,
                    background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)",
                  }}
                />

                {/* Reel strip */}
                <div ref={innerRef} className="relative z-0" style={{ willChange: "transform" }}>
                  {reelItems.map((name, i) => {
                    const distFromCenter = Math.abs(i - CENTER);
                    const isCenter = i === CENTER;
                    return (
                      <div
                        key={i}
                        style={{ height: ITEM_H }}
                        className="flex items-center justify-center px-4"
                      >
                        <span
                          className={[
                            "text-center font-bold leading-tight transition-none select-none",
                            isCenter && isWon
                              ? "text-green-400 text-xl drop-shadow-[0_0_8px_rgba(34,197,94,0.9)]"
                              : isCenter && running
                              ? "text-yellow-300 text-xl drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]"
                              : isCenter
                              ? "text-white text-xl"
                              : distFromCenter === 1
                              ? "text-white/40 text-base"
                              : "text-white/15 text-sm",
                          ].join(" ")}
                        >
                          {name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Winner badge */}
              <div className="mt-4 min-h-[48px] flex flex-col items-center justify-center">
                {isWon ? (
                  <div className="badge-pop text-center">
                    <p className="text-xs text-green-500 font-semibold uppercase tracking-widest mb-0.5">
                      🏆 Vencedor(a)
                    </p>
                    <p className="text-base font-bold text-foreground">{winner!.nome}</p>
                    <p className="text-xs text-muted-foreground">{winner!.email}</p>
                  </div>
                ) : running ? (
                  <p className="text-xs text-yellow-500 animate-pulse tracking-widest font-medium">
                    SORTEANDO…
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Clique em Sortear para iniciar
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-2 justify-center mt-3">
                {isWon && (
                  <Button size="sm" variant="outline" onClick={resetSorteio}>
                    Resetar
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={startSorteio}
                  disabled={running || lista.length === 0}
                  className={[
                    "min-w-[120px]",
                    running ? "opacity-70" : "",
                    isWon ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "",
                  ].join(" ")}
                >
                  {running ? "⏳ Sorteando…" : isWon ? "🎲 Sortear novamente" : "🎲 Sortear"}
                </Button>
              </div>
            </div>
          </div>

          {/* ── Full list ── */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
              Lista completa
            </p>
            <ul className="space-y-1">
              {lista.map((row, idx) => {
                const isWinner = isWon && winner!.id === row.id;
                return (
                  <li
                    key={row.id}
                    className={[
                      "rounded-md px-3 py-2 flex items-center gap-3 text-sm transition-colors",
                      isWinner
                        ? "bg-green-500/15 border border-green-500/40 font-semibold text-green-700 dark:text-green-400"
                        : "hover:bg-muted",
                    ].join(" ")}
                  >
                    <span className="tabular-nums text-xs w-7 text-right shrink-0 text-muted-foreground">
                      {idx + 1}
                    </span>
                    {isWinner && <span>🏆</span>}
                    <span className="flex-1 truncate">{row.nome}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{row.email}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end px-6 py-4 border-t shrink-0">
            <Button variant="outline" size="sm" onClick={() => { if (!running) onClose(); }} disabled={running}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function AdminLeadsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadsPage, setLeadsPage] = useState(1);
  const [apoiadoresPage, setApoiadoresPage] = useState(1);
  const [modal, setModal] = useState<{ title: string; lista: AnyRow[] } | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Falha ao carregar dados.");
      setStats(await res.json());
    } catch (e: unknown) {
      setError((e as Error).message || "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const leadsSlice     = stats ? stats.leads.slice((leadsPage - 1) * PER_PAGE, leadsPage * PER_PAGE) : [];
  const apoiadoresSlice = stats ? stats.apoiadores.slice((apoiadoresPage - 1) * PER_PAGE, apoiadoresPage * PER_PAGE) : [];

  return (
    <>
      {modal && <SorteioModal title={modal.title} lista={modal.lista} onClose={() => setModal(null)} />}

      <div className="flex flex-col gap-8 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold">Leads & Apoiadores</h1>
          <p className="text-muted-foreground text-sm">Intenção de apoio e contatos</p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardDescription>Total de Leads</CardDescription><CardTitle className="text-3xl">{loading ? "—" : stats?.totalLeads ?? 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Tem o apoio</CardDescription><CardTitle className="text-3xl text-green-500">{loading ? "—" : stats?.intencaoApoio.sim ?? 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Não tem o apoio</CardDescription><CardTitle className="text-3xl text-red-500">{loading ? "—" : stats?.intencaoApoio.nao ?? 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Indeciso</CardDescription><CardTitle className="text-3xl text-amber-500">{loading ? "—" : stats?.intencaoApoio.indeciso ?? 0}</CardTitle></CardHeader></Card>
        </div>

        {/* ── LEADS ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Lista de Leads</CardTitle>
              <CardDescription>{loading ? "Carregando..." : `${stats?.totalLeads ?? 0} lead(s) no total`}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => stats && setModal({ title: "Leads", lista: stats.leads })} disabled={!stats || stats.leads.length === 0}>
                Ver lista completa
              </Button>
              <Button size="sm" variant="outline" onClick={() => stats && downloadLeadsCSV(stats.leads)} disabled={!stats || stats.leads.length === 0}>
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : !stats || stats.leads.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Nenhum lead cadastrado ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead><TableHead>Email</TableHead>
                      <TableHead>Intenção</TableHead><TableHead>Indicado por</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsSlice.map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.nome}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{lead.email}</TableCell>
                        <TableCell><Badge variant={getApoioBadgeVariant(lead.intencaoApoio)}>{getApoioLabel(lead.intencaoApoio)}</Badge></TableCell>
                        <TableCell className="text-sm">
                          {lead.indicadoPor
                            ? <a href={`${origin}/dashboard/${lead.indicadoPor.codigoIndicacao}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{lead.indicadoPor.nome}</a>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pagination page={leadsPage} total={stats?.totalLeads ?? 0} onPrev={() => setLeadsPage(p => p-1)} onNext={() => setLeadsPage(p => p+1)} loading={loading} />
          </CardContent>
        </Card>

        {/* ── APOIADORES ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Lista de Apoiadores</CardTitle>
              <CardDescription>{loading ? "Carregando..." : `${stats?.totalApoiadores ?? 0} apoiador(es) com link de indicação`}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => stats && setModal({ title: "Apoiadores", lista: stats.apoiadores })} disabled={!stats || stats.apoiadores.length === 0}>
                Ver lista completa
              </Button>
              <Button size="sm" variant="outline" onClick={() => stats && downloadApoiadoresCSV(stats.apoiadores)} disabled={!stats || stats.apoiadores.length === 0}>
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : !stats || stats.apoiadores.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Nenhum apoiador cadastrado ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead><TableHead>Email</TableHead>
                      <TableHead>Código</TableHead><TableHead>Indicado por</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apoiadoresSlice.map(ap => (
                      <TableRow key={ap.id}>
                        <TableCell className="font-medium">
                          <a href={`${origin}/dashboard/${ap.codigoIndicacao}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{ap.nome}</a>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{ap.email}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono text-xs">{ap.codigoIndicacao}</Badge></TableCell>
                        <TableCell className="text-sm">
                          {ap.indicadoPor
                            ? <a href={`${origin}/dashboard/${ap.indicadoPor.codigoIndicacao}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{ap.indicadoPor.nome}</a>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">{new Date(ap.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pagination page={apoiadoresPage} total={stats?.totalApoiadores ?? 0} onPrev={() => setApoiadoresPage(p => p-1)} onNext={() => setApoiadoresPage(p => p+1)} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
