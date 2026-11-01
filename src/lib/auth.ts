import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Clinic Credentials',
      credentials: {
        email: { label: 'Clinic Email or Phone', type: 'text', placeholder: 'clinic@dawrak.com' },
        password: { label: 'Access Code', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo / Production authentication logic
        if (
          credentials.email === 'admin@dawrak.com' &&
          credentials.password === 'dawrak2026'
        ) {
          return {
            id: 'super-admin-1',
            name: 'Dawrak Super Admin',
            email: 'admin@dawrak.com',
            role: 'super-admin',
          };
        }

        // Clinic staff login
        return {
          id: 'clinic-staff-demo',
          name: 'Clinic Staff Demo',
          email: credentials.email,
          role: 'clinic-staff',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role?: string }).role || 'clinic-staff';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as unknown as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'dawrak-super-secret-key-medical-saas-2026',
};
