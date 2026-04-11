import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { auth, signIn, signOut, handlers } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };
        if (!email || !password) return null;

        // 1. Try Admin table
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (admin) {
          const valid = await bcrypt.compare(password, admin.password);
          if (!valid) return null;
          return { id: admin.id, email: admin.email, role: "admin" as const };
        }

        // 2. Try Apoiador table
        const apoiador = await prisma.apoiador.findUnique({ where: { email } });
        if (apoiador && apoiador.senha) {
          const valid = await bcrypt.compare(password, apoiador.senha);
          if (!valid) return null;
          return {
            id: apoiador.id,
            email: apoiador.email ?? email,
            role: "apoiador" as const,
            codigo: apoiador.codigoIndicacao,
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8h hard limit
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // sem maxAge → cookie de sessão: expira ao fechar o navegador
      },
    },
  },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.codigo = user.codigo;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as "admin" | "apoiador";
      session.user.codigo = token.codigo as string | undefined;
      return session;
    },
  },
});
