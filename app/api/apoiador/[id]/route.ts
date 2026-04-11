import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const apoiador = await prisma.apoiador.findFirst({
      where: {
        OR: [{ id }, { codigoIndicacao: id }],
      },
      include: {
        leads: {
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            nome: true,
            email: true,
            intencaoApoio: true,
            createdAt: true,
          },
        },
      },
    });

    if (!apoiador) {
      return NextResponse.json(
        { error: "Apoiador não encontrado." },
        { status: 404 }
      );
    }

    // Fetch apoiadores who registered via this apoiador's referral link
    const apoiadoresRecrutadosList = await prisma.apoiador.findMany({
      where: { indicadoPorCodigo: apoiador.codigoIndicacao },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true,
      },
    });

    // Normalize into the same shape as Lead rows
    const recrutadosRows = apoiadoresRecrutadosList.map((a) => ({
      id: a.id,
      nome: a.nome,
      email: a.email ?? "",
      intencaoApoio: "sim" as const,
      tipo: "apoiador" as const,
      createdAt: a.createdAt.toISOString(),
    }));

    // Normalize leads
    const leadRows = apoiador.leads.map((l) => ({
      ...l,
      tipo: "lead" as const,
      createdAt: new Date(l.createdAt).toISOString(),
    }));

    // Merge & sort by date desc
    const indicacoes = [...leadRows, ...recrutadosRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalIndicacoes = indicacoes.length;

    const baseUrl = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";
    const link = `${baseUrl}/apoiar?ref=${apoiador.codigoIndicacao}`;

    return NextResponse.json({
      apoiador: { ...apoiador, totalIndicacoes, indicacoes },
      link,
    });
  } catch (error) {
    console.error("[GET /api/apoiador/[id]]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
