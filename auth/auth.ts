import NextAuth from "next-auth";
import { ZodError } from "zod";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "@/schema/zod";
import { getUserFromDb } from "@/utils/user";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/utils/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          console.log("INFORMATION:", credentials);
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email и пароль обязательны");
          }

          const { email, password } = await signInSchema.parseAsync(
            credentials
          );

          const user = await getUserFromDb(email);
          console.log("USER FROM DB:", user);

          if (!user || !user.password) {
            throw new Error("Неверный ввод данных");
          }

          const isPasswordValid = password === user.password;
          console.log(isPasswordValid);

          if (!isPasswordValid) {
            throw new Error("Неверный ввод данных");
          }

          return { id: user.id, email: user.email, role: user.role };
        } catch (error) {
          if (error instanceof ZodError) {
            console.log(error);
            return null;
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 3600,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // добавляем роль
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          role: token.role, // теперь роль есть в session
        };
      }
      return session;
    },
  },
});
