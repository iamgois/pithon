import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) return null;
        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) return null;
        return { id: admin.id, email: admin.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
});
