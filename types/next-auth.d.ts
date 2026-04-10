import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: "admin" | "apoiador";
      codigo?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "apoiador";
    codigo?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "admin" | "apoiador";
    codigo?: string;
  }
}
