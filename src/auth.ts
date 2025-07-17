import NextAuth from 'next-auth';
import { getNextAuthConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth(getNextAuthConfig);
