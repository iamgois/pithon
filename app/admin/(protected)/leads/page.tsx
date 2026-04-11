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
  tipo: "lead" | "apoiador";
  createdAt: string;
  indicadoPor: { nome: string; codigoIndicacao: string } | null;
}

interface StatsData {
  totalLeads: number;
  intencaoApoio: { sim: number; nao: number; indeciso: number };
  leads: LeadRow[];
}

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

function downloadCSV(leads: LeadRow[]) {
  const headers = [
    "Nome",
    "Email",
    "Telefone",
    "Tipo",
    "Intenção de Apoio",
    "Indicado por (nome)",
    "Código de origem",
    "Data de cadastro",
  ];
  const rows = leads.map((l) => [
    esc(l.nome),
    esc(l.email),
    esc(l.telefone),
    l.tipo === "apoiador" ? "Apoiador" : "Lead",
    getApoioLabel(l.intencaoApoio),
    esc(l.indicadoPor?.nome),
    esc(l.origemCodigo),
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

export default function AdminLeadsPage() {
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

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-muted-foreground text-sm">Intenção de apoio e contatos</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Leads</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? "—" : (stats?.totalLeads ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tem o apoio</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {loading ? "—" : (stats?.intencaoApoio.sim ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Não tem o apoio</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {loading ? "—" : (stats?.intencaoApoio.nao ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Indeciso</CardDescription>
            <CardTitle className="text-3xl text-amber-500">
              {loading ? "—" : (stats?.intencaoApoio.indeciso ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Leads table */}
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
              Nenhum lead cadastrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
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
                        <Badge variant={lead.tipo === "apoiador" ? "default" : "secondary"}>
                          {lead.tipo === "apoiador" ? "Apoiador" : "Lead"}
                        </Badge>
                      </TableCell>
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
    </div>
  );
}
