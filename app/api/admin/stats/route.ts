import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const apoiadorFilter = searchParams.get("apoiador") || undefined;
    const dataInicio = searchParams.get("dataInicio") || undefined;
    const dataFim = searchParams.get("dataFim") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = 100;
    const skip = (page - 1) * perPage;

    const leadWhere: Record<string, unknown> = {};
    if (apoiadorFilter) {
      leadWhere.origemCodigo = apoiadorFilter;
    }
    if (dataInicio || dataFim) {
      leadWhere.createdAt = {};
      if (dataInicio) {
        (leadWhere.createdAt as Record<string, unknown>).gte = new Date(dataInicio);
      }
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setDate(fim.getDate() + 1);
        (leadWhere.createdAt as Record<string, unknown>).lt = fim;
      }
    }

    // Build date filter for apoiadores
    let apoiadorDateFilter: { gte?: Date; lt?: Date } | undefined;
    if (dataInicio || dataFim) {
      apoiadorDateFilter = {};
      if (dataInicio) apoiadorDateFilter.gte = new Date(dataInicio);
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setDate(fim.getDate() + 1);
        apoiadorDateFilter.lt = fim;
      }
    }

    const [
      leadsRaw,
      apoiadoresIndicados,
      totalLeadsDB,
      simCount,
      naoCount,
      indeciso,
      allApoiadoresRank,
      totalApoiadores,
      indicacaoCount,
      indicacaoPorApoiador,
      apoiadoresPorCodigoIndicador,
    ] = await Promise.all([
      prisma.lead.findMany({
        where: leadWhere,
        orderBy: { createdAt: "desc" },
        take: perPage,
        skip,
        include: { indicadoPor: { select: { nome: true, codigoIndicacao: true } } },
      }),
      prisma.apoiador.findMany({
        where: {
          indicadoPorCodigo: apoiadorFilter ? apoiadorFilter : { not: null },
          ...(apoiadorDateFilter ? { createdAt: apoiadorDateFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: perPage,
        skip,
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          indicadoPorCodigo: true,
          createdAt: true,
        },
      }),
      prisma.lead.count({ where: leadWhere }),
      prisma.lead.count({ where: { ...leadWhere, intencaoApoio: "sim" } }),
      prisma.lead.count({ where: { ...leadWhere, intencaoApoio: "nao" } }),
      prisma.lead.count({ where: { ...leadWhere, intencaoApoio: "indeciso" } }),
      prisma.apoiador.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          codigoIndicacao: true,
          createdAt: true,
        },
      }),
      prisma.apoiador.count(),
      prisma.indicacao.count(),
      prisma.indicacao.groupBy({
        by: ["apoiadorId"],
        _count: { _all: true },
      }),
      prisma.apoiador.groupBy({
        by: ["indicadoPorCodigo"],
        where: { indicadoPorCodigo: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const leadsPorApoiador = Object.fromEntries(
      indicacaoPorApoiador.map((g) => [g.apoiadorId, g._count._all])
    );
    const apoiadoresRecrutadosPorCodigo = Object.fromEntries(
      apoiadoresPorCodigoIndicador.map((g) => [
        g.indicadoPorCodigo as string,
        g._count._all,
      ])
    );

    function indicacoesDoApoiador(a: { id: string; codigoIndicacao: string }) {
      return (leadsPorApoiador[a.id] ?? 0) + (apoiadoresRecrutadosPorCodigo[a.codigoIndicacao] ?? 0);
    }

    const topApoiadores = allApoiadoresRank
      .map((a) => ({
        id: a.id,
        nome: a.nome,
        email: a.email ?? "",
        codigoIndicacao: a.codigoIndicacao,
        totalIndicacoes: indicacoesDoApoiador(a),
        createdAt: a.createdAt,
      }))
      .sort(
        (x, y) =>
          y.totalIndicacoes - x.totalIndicacoes ||
          y.createdAt.getTime() - x.createdAt.getTime()
      )
      .slice(0, 10);

    const totalIndicacoesPorApoiadorIndicado = apoiadoresPorCodigoIndicador.reduce(
      (acc, g) => acc + g._count._all,
      0
    );
    const totalIndicacoes = indicacaoCount + totalIndicacoesPorApoiadorIndicado;

    // Resolve the names of who indicated each apoiador
    const refCodigos = [...new Set(apoiadoresIndicados.map((a) => a.indicadoPorCodigo).filter(Boolean) as string[])];
    const refApoiadores = refCodigos.length
      ? await prisma.apoiador.findMany({
          where: { codigoIndicacao: { in: refCodigos } },
          select: { nome: true, codigoIndicacao: true },
        })
      : [];
    const refMap = Object.fromEntries(refApoiadores.map((a) => [a.codigoIndicacao, a.nome]));

    // Normalize apoiadores-by-referral into the same shape as leads
    const apoiadorRows = apoiadoresIndicados.map((a) => ({
      id: a.id,
      nome: a.nome,
      email: a.email ?? "",
      telefone: a.telefone ?? null,
      origemCodigo: a.indicadoPorCodigo ?? null,
      intencaoApoio: "sim",
      tipo: "apoiador" as const,
      createdAt: a.createdAt.toISOString(),
      indicadoPor: a.indicadoPorCodigo
        ? { nome: refMap[a.indicadoPorCodigo] ?? a.indicadoPorCodigo, codigoIndicacao: a.indicadoPorCodigo }
        : null,
    }));

    const leadRows = leadsRaw.map((l) => ({
      ...l,
      tipo: "lead" as const,
      createdAt: l.createdAt.toISOString(),
    }));

    // Merge and sort by createdAt desc
    const leads = [...leadRows, ...apoiadorRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalLeads = totalLeadsDB + apoiadoresIndicados.length;

    return NextResponse.json({
      totalLeads,
      totalIndicacoes,
      intencaoApoio: { sim: simCount + apoiadoresIndicados.length, nao: naoCount, indeciso },
      topApoiadores,
      leads,
      totalApoiadores,
      page,
      perPage,
    });
  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
