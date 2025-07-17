import { z } from 'zod';

export const userProfileOutputSchema = {
  profile: z.object(
    {
      id: z.string({ description: 'User ID' }),
      name: z.string({ description: 'User Name' }),
      email: z.string({ description: 'User Email' }),
      context: z.string({
        description:
          'This is details about the user that you should consider when working on tasks for them.',
      }),
    },
    { description: 'The user profile details' }
  ),
};
