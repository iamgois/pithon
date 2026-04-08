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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ApoiadorSummary {
  id: string;
  nome: string;
  email: string;
  codigoIndicacao: string;
  totalIndicacoes: number;
  createdAt: string;
}

interface LeadRow {
  id: string;
  nome: string;
  email: string;
  intencaoVoto: string;
  createdAt: string;
  indicadoPor: { nome: string; codigoIndicacao: string } | null;
}

interface StatsData {
  totalLeads: number;
  totalApoiadores: number;
  intencaoVoto: { sim: number; nao: number; indeciso: number };
  topApoiadores: ApoiadorSummary[];
  leads: LeadRow[];
}

const PIE_COLORS = ["#22c55e", "#ef4444", "#f59e0b"];

function getVotoBadgeVariant(voto: string): "default" | "secondary" | "destructive" {
  if (voto === "sim") return "default";
  if (voto === "nao") return "destructive";
  return "secondary";
}

function getVotoLabel(voto: string): string {
  if (voto === "sim") return "Sim";
  if (voto === "nao") return "Não";
  return "Indeciso";
}

function downloadCSV(leads: LeadRow[]) {
  const headers = ["Nome", "Email", "Intenção de Voto", "Indicado por", "Data"];
  const rows = leads.map((l) => [
    `"${l.nome}"`,
    `"${l.email}"`,
    getVotoLabel(l.intencaoVoto),
    l.indicadoPor ? `"${l.indicadoPor.nome}"` : "",
    new Date(l.createdAt).toLocaleDateString("pt-BR"),
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

export default function AdminPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterApoiador, setFilterApoiador] = useState<string>("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterApoiador) params.set("apoiador", filterApoiador);
      if (filterDataInicio) params.set("dataInicio", filterDataInicio);
      if (filterDataFim) params.set("dataFim", filterDataFim);

      const res = await fetch(`/api/admin/stats?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar dados.");
      const data = await res.json();
      setStats(data);
    } catch (e: unknown) {
      setError((e as Error).message || "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [filterApoiador, filterDataInicio, filterDataFim]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const pieData = stats
    ? [
        { name: "Sim", value: stats.intencaoVoto.sim },
        { name: "Não", value: stats.intencaoVoto.nao },
        { name: "Indeciso", value: stats.intencaoVoto.indeciso },
      ]
    : [];

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  function handleClearFilters() {
    setFilterApoiador("");
    setFilterDataInicio("");
    setFilterDataFim("");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Campanha de indicações Pithon</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="apoiadores">
        <TabsList>
          <TabsTrigger value="apoiadores">Apoiadores</TabsTrigger>
          <TabsTrigger value="intencao">Intenção de Voto</TabsTrigger>
        </TabsList>

        {/* ====== TAB 1: APOIADORES ====== */}
        <TabsContent value="apoiadores" className="flex flex-col gap-6 pt-4">
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
                  {loading
                    ? "—"
                    : (stats?.topApoiadores ?? []).reduce(
                        (acc, a) => acc + a.totalIndicacoes,
                        0
                      )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Top 10 Ranking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 Apoiadores</CardTitle>
              <CardDescription>Ordenados por número de indicações</CardDescription>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Indicações</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topApoiadores.map((a, i) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {i + 1}
                        </TableCell>
                        <TableCell className="font-medium">{a.nome}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {a.email}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={a.totalIndicacoes > 0 ? "default" : "secondary"}>
                            {a.totalIndicacoes}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`/dashboard/${a.codigoIndicacao}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline font-mono"
                          >
                            {a.codigoIndicacao}
                          </a>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== TAB 2: INTENÇÃO DE VOTO ====== */}
        <TabsContent value="intencao" className="flex flex-col gap-6 pt-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Apoiador
                </Label>
                <Select
                  value={filterApoiador || "__all__"}
                  onValueChange={(v) =>
                    setFilterApoiador(v === "__all__" ? "" : (v ?? ""))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {(stats?.topApoiadores ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.codigoIndicacao}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Data início
                </Label>
                <Input
                  type="date"
                  value={filterDataInicio}
                  onChange={(e) => setFilterDataInicio(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Data fim
                </Label>
                <Input
                  type="date"
                  value={filterDataFim}
                  onChange={(e) => setFilterDataFim(e.target.value)}
                />
              </div>
            </CardContent>
            <CardContent className="pt-0 flex gap-2">
              <Button size="sm" onClick={fetchStats} disabled={loading}>
                Aplicar filtros
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Limpar
              </Button>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Leads</CardDescription>
                <CardTitle className="text-3xl">
                  {loading ? "—" : (stats?.totalLeads ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sim</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {loading ? "—" : (stats?.intencaoVoto.sim ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Não</CardDescription>
                <CardTitle className="text-3xl text-red-600">
                  {loading ? "—" : (stats?.intencaoVoto.nao ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Indecisos</CardDescription>
                <CardTitle className="text-3xl text-amber-600">
                  {loading ? "—" : (stats?.intencaoVoto.indeciso ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Pie chart */}
          {!loading && stats && stats.totalLeads > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Intenção de Voto</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Leads table with export */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Lista de Leads</CardTitle>
                <CardDescription>
                  {stats?.leads.length ?? 0} registro(s)
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => stats && downloadCSV(stats.leads)}
                disabled={!stats || stats.leads.length === 0}
              >
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Carregando...
                </div>
              ) : !stats || stats.leads.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Nenhum lead encontrado com os filtros atuais.
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
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.nome}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {lead.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getVotoBadgeVariant(lead.intencaoVoto)}>
                              {getVotoLabel(lead.intencaoVoto)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {lead.indicadoPor ? (
                              <a
                                href={`${origin}/dashboard/${lead.indicadoPor.codigoIndicacao}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {lead.indicadoPor.nome}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
