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
  intencaoVoto: { sim: number; nao: number; indeciso: number };
  topApoiadores: ApoiadorSummary[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const totalIndicacoes = (stats?.topApoiadores ?? []).reduce(
    (acc, a) => acc + a.totalIndicacoes,
    0
  );

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
          ) : !stats || stats.topApoiadores.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum apoiador cadastrado ainda.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stats.topApoiadores.map((a, i) => {
                const max = stats.topApoiadores[0]?.totalIndicacoes || 1;
                const pct = max > 0 ? (a.totalIndicacoes / max) * 100 : 0;
                const rankStyle =
                  i === 0
                    ? "text-white font-bold text-lg"
                    : i === 1
                    ? "text-zinc-300 font-semibold"
                    : i === 2
                    ? "text-zinc-400 font-semibold"
                    : "text-muted-foreground";
                const rowBg =
                  i === 0
                    ? "bg-white/[0.06]"
                    : i === 1
                    ? "bg-white/[0.03]"
                    : i === 2
                    ? "bg-white/[0.015]"
                    : "";
                const borderLeft =
                  i === 0
                    ? "border-l-2 border-l-zinc-300"
                    : i === 1
                    ? "border-l-2 border-l-zinc-500"
                    : i === 2
                    ? "border-l-2 border-l-zinc-600"
                    : "border-l-2 border-l-transparent";
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-4 px-4 py-3.5 ${rowBg} ${borderLeft}`}
                  >
                    <span className={`w-7 shrink-0 text-center font-mono ${rankStyle}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <span
                            className={`font-medium truncate block ${
                              i === 0 ? "text-white" : ""
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
                            className={i === 0 ? "bg-white text-black font-bold" : ""}
                          >
                            {a.totalIndicacoes}{" "}
                            {a.totalIndicacoes === 1 ? "indicação" : "indicações"}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            i === 0
                              ? "bg-white"
                              : i === 1
                              ? "bg-zinc-400"
                              : i === 2
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
        </CardContent>
      </Card>
    </div>
  );
}
