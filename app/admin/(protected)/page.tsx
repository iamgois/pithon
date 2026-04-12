"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ApoiadorSummary {
  id: string;
  nome: string;
  email: string;
  codigoIndicacao: string;
  totalIndicacoes: number;
  createdAt: string;
}

interface StatsData {
  totalLeads: number;
  totalApoiadores: number;
  totalIndicacoes: number;
  topApoiadores: ApoiadorSummary[];
  rankingApoiadores: ApoiadorSummary[];
}

const PER_PAGE = 10;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
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

  const totalIndicacoes = stats?.totalIndicacoes ?? 0;
  const ranking = stats?.rankingApoiadores ?? [];
  const totalPages = Math.max(1, Math.ceil(ranking.length / PER_PAGE));
  const rankingSlice = ranking.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // The max indicacoes is always from the global top (page 1 item 0)
  const globalMax = ranking[0]?.totalIndicacoes || 1;

  // Global position offset for rank number
  const rankOffset = (page - 1) * PER_PAGE;

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Campanha de indicações Pithon</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Apoiadores</CardDescription>
            <CardTitle className="text-4xl">
              {loading ? "—" : (stats?.totalApoiadores ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Indicações</CardDescription>
            <CardTitle className="text-4xl">
              {loading ? "—" : totalIndicacoes}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de Apoiadores</CardTitle>
          <CardDescription>Quem mais trouxe indicações</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : ranking.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum apoiador cadastrado ainda.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rankingSlice.map((a, i) => {
                const globalRank = rankOffset + i;
                const pct = globalMax > 0 ? (a.totalIndicacoes / globalMax) * 100 : 0;
                const rankStyle =
                  globalRank === 0
                    ? "text-white font-bold text-lg"
                    : globalRank === 1
                    ? "text-zinc-300 font-semibold"
                    : globalRank === 2
                    ? "text-zinc-400 font-semibold"
                    : "text-muted-foreground";
                const rowBg =
                  globalRank === 0
                    ? "bg-white/[0.06]"
                    : globalRank === 1
                    ? "bg-white/[0.03]"
                    : globalRank === 2
                    ? "bg-white/[0.015]"
                    : "";
                const borderLeft =
                  globalRank === 0
                    ? "border-l-2 border-l-zinc-300"
                    : globalRank === 1
                    ? "border-l-2 border-l-zinc-500"
                    : globalRank === 2
                    ? "border-l-2 border-l-zinc-600"
                    : "border-l-2 border-l-transparent";
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-4 px-4 py-3.5 ${rowBg} ${borderLeft}`}
                  >
                    <span className={`w-7 shrink-0 text-center font-mono ${rankStyle}`}>
                      {globalRank + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <span
                            className={`font-medium truncate block ${
                              globalRank === 0 ? "text-white" : ""
                            }`}
                          >
                            {a.nome}
                          </span>
                          <span className="text-muted-foreground text-xs truncate block">
                            {a.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={a.totalIndicacoes > 0 ? "default" : "secondary"}
                            className={globalRank === 0 ? "bg-white text-black font-bold" : ""}
                          >
                            {a.totalIndicacoes}{" "}
                            {a.totalIndicacoes === 1 ? "indicação" : "indicações"}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            globalRank === 0
                              ? "bg-white"
                              : globalRank === 1
                              ? "bg-zinc-400"
                              : globalRank === 2
                              ? "bg-zinc-500"
                              : "bg-zinc-600"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <a
                      href={`/dashboard/${a.codigoIndicacao}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-500 hover:text-zinc-300 font-mono shrink-0 hidden sm:block"
                    >
                      {a.codigoIndicacao}
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Página {page} de {totalPages} · {ranking.length} apoiador(es)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
