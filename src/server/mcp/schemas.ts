import { z } from 'zod';

export const userProfileOutputSchema = {
  profile: z.object(
    {
      id: z.string({ description: 'User ID' }),
      name: z.string({ description: 'User Name' }).nullable(),
      email: z.string({ description: 'User Email' }).nullable(),
      context: z.string({
        description:
          'This is details about the user that you should consider when working on tasks for them.',
      }),
    },
    { description: 'The user profile details' }
  ),
};

const userProfileOutputSchemaFull = z.object(userProfileOutputSchema);

export type UserProfileOutputSchemaType = z.infer<typeof userProfileOutputSchemaFull>;
