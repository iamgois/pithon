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
import { Skeleton } from "@/components/ui/skeleton";
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
  nivelApoio: string | null;
  tipo: "apoiador";
  createdAt: string;
  indicadoPor: { nome: string; codigoIndicacao: string } | null;
}

interface StatsData {
  totalLeads: number;
  totalApoiadores: number;
  nivelApoio: { simpatizante: number; recruta: number; operadorEspecial: number };
  leads: LeadRow[];
  apoiadores: ApoiadorRow[];
}

type AnyRow = LeadRow | ApoiadorRow;

const PER_PAGE = 10;

function getApoioBadgeVariant(
  voto: string
): "default" | "secondary" | "destructive" {
  if (voto === "sim") return "default";
  if (voto === "nao") return "destructive";
  return "secondary";
}

function getApoioLabel(voto: string): string {
  if (voto === "sim") return "Sim";
  if (voto === "nao") return "Não";
  return "Indeciso";
}

function esc(value: string | null | undefined): string {
  if (!value) return "";
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadLeadsCSV(leads: LeadRow[]) {
  const headers = [
    "Nome", "Email", "Telefone", "Intenção de Apoio",
    "Indicado por (nome)", "Código de origem", "Data de cadastro",
  ];
  const rows = leads.map((l) => [
    esc(l.nome), esc(l.email), esc(l.telefone),
    getApoioLabel(l.intencaoApoio), esc(l.indicadoPor?.nome),
    esc(l.origemCodigo), new Date(l.createdAt).toLocaleDateString("pt-BR"),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-pithon-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadApoiadoresCSV(apoiadores: ApoiadorRow[]) {
  const headers = [
    "Nome", "Email", "Telefone", "Código de Indicação",
    "Indicado por (nome)", "Data de cadastro",
  ];
  const rows = apoiadores.map((a) => [
    esc(a.nome), esc(a.email), esc(a.telefone), esc(a.codigoIndicacao),
    esc(a.indicadoPor?.nome), new Date(a.createdAt).toLocaleDateString("pt-BR"),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `apoiadores-pithon-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Skeleton: summary cards (4 cols) ── */
function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-3 w-28 mb-3" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-36 mt-2" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

/* ── Skeleton: table rows ── */
function TableSkeleton({ cols = 5, rows = 10 }: { cols?: number; rows?: number }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton className={`h-4 ${c === 0 ? "w-36" : c === 1 ? "w-48" : "w-20"}`} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Pagination({
  page, total, onPrev, onNext, loading,
}: {
  page: number; total: number; onPrev: () => void; onNext: () => void; loading: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages} · {total} registro(s)
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={onPrev}>
          ← Anterior
        </Button>
        <Button size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={onNext}>
          Próxima →
        </Button>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   SORTEIO MODAL
─────────────────────────────────────────── */
function SorteioModal({
  title,
  lista,
  onClose,
}: {
  title: string;
  lista: AnyRow[];
  onClose: () => void;
}) {
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [winner, setWinner] = useState<AnyRow | null>(null);
  const [running, setRunning] = useState(false);
  const winnerRef = useRef<HTMLLIElement | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up any pending timeouts when modal unmounts
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  // Scroll winner into view once animation ends
  useEffect(() => {
    if (winner && winnerRef.current) {
      winnerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [winner]);

  function startSorteio() {
    if (lista.length === 0) return;
    // Clear previous state
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setWinner(null);
    setHighlighted(null);
    setRunning(true);

    const winnerIdx = Math.floor(Math.random() * lista.length);

    // Build animation schedule: fast → slow
    // Each entry: [delay_from_start_ms, index_to_show]
    const schedule: number[] = [];

    // Phase 1: rapid fire (50ms each, 20 steps)
    let t = 0;
    for (let i = 0; i < 20; i++) {
      t += 50;
      schedule.push(t);
    }
    // Phase 2: medium (120ms each, 12 steps)
    for (let i = 0; i < 12; i++) {
      t += 120;
      schedule.push(t);
    }
    // Phase 3: slow (250ms each, 8 steps)
    for (let i = 0; i < 8; i++) {
      t += 250;
      schedule.push(t);
    }
    // Phase 4: very slow (500ms each, 5 steps)
    for (let i = 0; i < 5; i++) {
      t += 500;
      schedule.push(t);
    }

    const total = schedule.length;

    schedule.forEach((delay, stepIdx) => {
      const isLast = stepIdx === total - 1;
      const id = setTimeout(() => {
        if (isLast) {
          setHighlighted(winnerIdx);
          setWinner(lista[winnerIdx]);
          setRunning(false);
        } else {
          // Pick a random index that's NOT the winner for intermediate steps
          let idx: number;
          do { idx = Math.floor(Math.random() * lista.length); }
          while (lista.length > 1 && idx === winnerIdx);
          setHighlighted(idx);
        }
      }, delay);
      timeoutsRef.current.push(id);
    });
  }

  function resetSorteio() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setHighlighted(null);
    setWinner(null);
    setRunning(false);
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">{lista.length} registro(s)</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Winner banner */}
        {winner && (
          <div className="mx-6 mt-4 rounded-lg border-2 border-green-500 bg-green-500/10 px-4 py-3 text-center shrink-0">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">🎉 Sorteado!</p>
            <p className="text-xl font-bold text-green-700">{winner.nome}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{winner.email}</p>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="space-y-1">
            {lista.map((row, idx) => {
              const isHighlighted = highlighted === idx;
              const isWinner = winner && winner.id === row.id;
              return (
                <li
                  key={row.id}
                  ref={isWinner ? winnerRef : undefined}
                  className={[
                    "rounded-md px-3 py-2 flex items-center gap-3 transition-all duration-75 text-sm",
                    isWinner
                      ? "bg-green-500 text-white font-bold scale-[1.02] shadow-md"
                      : isHighlighted
                      ? "bg-primary text-primary-foreground font-semibold scale-[1.01]"
                      : "hover:bg-muted",
                  ].join(" ")}
                >
                  <span className="tabular-nums text-xs w-6 text-right shrink-0 opacity-50">
                    {idx + 1}
                  </span>
                  <span className="flex-1 truncate">{row.nome}</span>
                  <span className="text-xs opacity-70 truncate max-w-[140px]">{row.email}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <div className="flex gap-2">
            {(winner || running) && !running && (
              <Button variant="outline" size="sm" onClick={resetSorteio}>
                Resetar
              </Button>
            )}
            <Button
              size="sm"
              onClick={startSorteio}
              disabled={running || lista.length === 0}
              className={running ? "animate-pulse" : ""}
            >
              {running ? "Sorteando…" : winner ? "Sortear novamente" : "🎲 Sortear"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   MAIN PAGE
─────────────────────────────────────────── */
export default function AdminLeadsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Independent pagination states
  const [leadsPage, setLeadsPage] = useState(1);
  const [apoiadoresPage, setApoiadoresPage] = useState(1);

  // Filter for apoiadores nivelApoio
  const [nivelFiltro, setNivelFiltro] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<{ title: string; lista: AnyRow[] } | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stats`);
      if (!res.ok) throw new Error("Falha ao carregar dados.");
      const data = await res.json();
      setStats(data);
    } catch (e: unknown) {
      setError((e as Error).message || "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // Client-side slices
  const leadsSlice = stats
    ? stats.leads.slice((leadsPage - 1) * PER_PAGE, leadsPage * PER_PAGE)
    : [];

  const apoiadoresFiltrados = stats
    ? nivelFiltro
      ? stats.apoiadores.filter((a) => a.nivelApoio === nivelFiltro)
      : stats.apoiadores
    : [];
  const apoiadoresSlice = apoiadoresFiltrados.slice(
    (apoiadoresPage - 1) * PER_PAGE,
    apoiadoresPage * PER_PAGE
  );

  return (
    <>
      {/* Modal */}
      {modal && (
        <SorteioModal
          title={modal.title}
          lista={modal.lista}
          onClose={() => setModal(null)}
        />
      )}

      <div className="flex flex-col gap-8 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold">Leads & Apoiadores</h1>
          <p className="text-muted-foreground text-sm">Intenção de apoio e contatos</p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Summary cards */}
        {loading ? <SummaryCardsSkeleton /> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Leads</CardDescription>
                <CardTitle className="text-3xl">
                  {(stats?.totalLeads ?? 0) + (stats?.totalApoiadores ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Simpatizante</CardDescription>
                <CardTitle className="text-3xl text-blue-500">
                  {stats?.nivelApoio?.simpatizante ?? 0}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Quero conhecer mais</p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Recruta</CardDescription>
                <CardTitle className="text-3xl text-orange-500">
                  {stats?.nivelApoio?.recruta ?? 0}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Conte com meu apoio</p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Operador Especial</CardDescription>
                <CardTitle className="text-3xl text-red-500">
                  {stats?.nivelApoio?.operadorEspecial ?? 0}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Conte com meu apoio + quero ajudar</p>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* ── APOIADORES TABLE ── */}
        <Card>
          <CardHeader className="flex flex-col gap-3">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Lista de Apoiadores</CardTitle>
                <CardDescription>
                  {loading
                    ? "Carregando..."
                    : `${apoiadoresFiltrados.length} apoiador(es)${nivelFiltro ? " (filtrado)" : " com link de indicação"}`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    stats &&
                    setModal({ title: "Lista de Apoiadores", lista: apoiadoresFiltrados })
                  }
                  disabled={!stats || apoiadoresFiltrados.length === 0}
                >
                  Ver lista completa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadApoiadoresCSV(apoiadoresFiltrados as ApoiadorRow[])}
                  disabled={apoiadoresFiltrados.length === 0}
                >
                  Exportar CSV
                </Button>
              </div>
            </div>
            {/* Filtros de nível */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: null, label: "Todos" },
                { value: "simpatizante", label: "Simpatizante", color: "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-800" },
                { value: "recruta", label: "Recruta", color: "text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950 dark:border-orange-800" },
                { value: "operador_especial", label: "Operador Especial", color: "text-red-600 border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => { setNivelFiltro(opt.value); setApoiadoresPage(1); }}
                  className={[
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    nivelFiltro === opt.value
                      ? opt.color ?? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <>
                {/* Filter pills skeleton */}
                <div className="flex gap-2 px-6 pb-4">
                  {[60, 90, 72, 120].map((w) => (
                    <Skeleton key={w} className={`h-6 w-${w} rounded-full`} style={{ width: w }} />
                  ))}
                </div>
                <TableSkeleton cols={6} rows={10} />
              </>
            ) : apoiadoresFiltrados.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum apoiador encontrado{nivelFiltro ? " para este filtro" : ""}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Indicado por</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apoiadoresSlice.map((ap) => (
                      <TableRow key={ap.id}>
                        <TableCell className="font-medium">
                          <a
                            href={`${origin}/dashboard/${ap.codigoIndicacao}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {ap.nome}
                          </a>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{ap.email}</TableCell>
                        <TableCell>
                          {ap.nivelApoio === "simpatizante" && <Badge className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300">Simpatizante</Badge>}
                          {ap.nivelApoio === "recruta" && <Badge className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300">Recruta</Badge>}
                          {ap.nivelApoio === "operador_especial" && <Badge className="bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300">Op. Especial</Badge>}
                          {!ap.nivelApoio && <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {ap.codigoIndicacao}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {ap.indicadoPor ? (
                            <a
                              href={`${origin}/dashboard/${ap.indicadoPor.codigoIndicacao}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {ap.indicadoPor.nome}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {new Date(ap.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pagination
              page={apoiadoresPage}
              total={apoiadoresFiltrados.length}
              onPrev={() => setApoiadoresPage((p) => p - 1)}
              onNext={() => setApoiadoresPage((p) => p + 1)}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* ── LEADS TABLE ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Lista de Leads</CardTitle>
              <CardDescription>
                {loading ? "Carregando..." : `${stats?.totalLeads ?? 0} lead(s) no total`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  stats &&
                  setModal({ title: "Lista de Leads", lista: stats.leads })
                }
                disabled={!stats || stats.leads.length === 0}
              >
                Ver lista completa
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => stats && downloadLeadsCSV(stats.leads)}
                disabled={!stats || stats.leads.length === 0}
              >
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton cols={5} rows={10} />
            ) : !stats || stats.leads.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum lead cadastrado ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Intenção</TableHead>
                      <TableHead>Indicado por</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsSlice.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.nome}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{lead.email}</TableCell>
                        <TableCell>
                          <Badge variant={getApoioBadgeVariant(lead.intencaoApoio)}>
                            {getApoioLabel(lead.intencaoApoio)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {lead.indicadoPor ? (
                            <a
                              href={`${origin}/dashboard/${lead.indicadoPor.codigoIndicacao}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {lead.indicadoPor.nome}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pagination
              page={leadsPage}
              total={stats?.totalLeads ?? 0}
              onPrev={() => setLeadsPage((p) => p - 1)}
              onNext={() => setLeadsPage((p) => p + 1)}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
