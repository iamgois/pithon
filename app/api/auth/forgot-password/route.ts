import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });

    const normalized = email.trim().toLowerCase();

    // Check if email belongs to an admin or apoiador
    const [admin, apoiador] = await Promise.all([
      prisma.admin.findUnique({ where: { email: normalized } }),
      prisma.apoiador.findUnique({ where: { email: normalized } }),
    ]);

    // Always return success to avoid user enumeration
    if (!admin && !apoiador) {
      return NextResponse.json({ ok: true });
    }

    // Delete any existing token for this email
    await prisma.passwordResetToken.deleteMany({ where: { email: normalized } });

    // Create new token valid for 1 hour
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { email: normalized, token, expiresAt } });

    const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://comunidade.douglaspithonoe35.com.br";
    const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`;

    await resend.emails.send({
      from: "Pithon 35 <noreply@nexosales.com.br>",
      to: normalized,
      subject: "Redefinição de senha — Pithon 35",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f0f0f;color:#e4e4e7;border-radius:12px;">
          <h2 style="margin:0 0 8px;font-size:22px;color:#ffffff;">Redefinir sua senha</h2>
          <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;">
            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
          </p>
          <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:#ffffff;color:#0f0f0f;font-weight:700;font-size:15px;border-radius:8px;text-decoration:none;">
            Redefinir senha
          </a>
          <p style="margin:24px 0 0;color:#71717a;font-size:13px;">
            Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, pode ignorar este e-mail com segurança.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
