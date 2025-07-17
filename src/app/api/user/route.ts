'use server';

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { handleRequest } from '@/lib/handle-request';
import { auth } from '@/auth';
import { User } from '@/server/models/user';

const formSchema = z.object({
  context: z.string().trim().max(500, 'Max 500 characters'),
});

export const POST = handleRequest(async req => {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const payload = await formSchema.safeParseAsync(await req.json());
  if (payload.error) {
    return NextResponse.json({ error: payload.error.message }, { status: 400 });
  }

  const user = await User.findOne({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await user.update(
    {
      profile: {
        context: payload.data.context,
      },
    },
    { fields: ['profile'] }
  );

  return NextResponse.json({ data: user });
});
