import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record) {
      return NextResponse.json({ error: "Link inválido ou já utilizado." }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const email = record.email;

    // Update whichever account owns this email
    const [adminUpdate, apoiadorUpdate] = await Promise.all([
      prisma.admin.updateMany({ where: { email }, data: { password: hashed } }),
      prisma.apoiador.updateMany({ where: { email }, data: { senha: hashed } }),
    ]);

    if (adminUpdate.count === 0 && apoiadorUpdate.count === 0) {
      return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    }

    // Consume the token
    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
