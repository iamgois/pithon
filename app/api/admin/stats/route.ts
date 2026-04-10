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

    const [
      totalLeads,
      simCount,
      naoCount,
      indeciso,
      topApoiadores,
      leads,
      totalApoiadores,
    ] = await Promise.all([
      prisma.lead.count({ where: leadWhere }),
      prisma.lead.count({ where: { ...leadWhere, intencaoVoto: "sim" } }),
      prisma.lead.count({ where: { ...leadWhere, intencaoVoto: "nao" } }),
      prisma.lead.count({ where: { ...leadWhere, intencaoVoto: "indeciso" } }),
      prisma.apoiador.findMany({
        orderBy: { totalIndicacoes: "desc" },
        take: 10,
        select: {
          id: true,
          nome: true,
          email: true,
          codigoIndicacao: true,
          totalIndicacoes: true,
          createdAt: true,
        },
      }),
      prisma.lead.findMany({
        where: leadWhere,
        orderBy: { createdAt: "desc" },
        include: {
          indicadoPor: {
            select: { nome: true, codigoIndicacao: true },
          },
        },
      }),
      prisma.apoiador.count(),
    ]);

    return NextResponse.json({
      totalLeads,
      intencaoVoto: { sim: simCount, nao: naoCount, indeciso },
      topApoiadores,
      leads,
      totalApoiadores,
    });
  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
