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

    const [leadsIndicados, apoiadoresRecrutados] = await Promise.all([
      prisma.indicacao.count({ where: { apoiadorId: apoiador.id } }),
      prisma.apoiador.count({
        where: { indicadoPorCodigo: apoiador.codigoIndicacao },
      }),
    ]);
    const totalIndicacoes = leadsIndicados + apoiadoresRecrutados;

    const baseUrl = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";
    const link = `${baseUrl}/apoiar?ref=${apoiador.codigoIndicacao}`;

    return NextResponse.json({
      apoiador: { ...apoiador, totalIndicacoes },
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
