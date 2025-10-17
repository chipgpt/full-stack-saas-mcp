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

export const updateProfileInputSchema = {
  context: z.string(),
};

export const vaultOutputSchema = {
  vault: z
    .object({
      id: z.string(),
      name: z.string(),
      min: z.number(),
      max: z.number(),
      value: z.number(),
      openedAt: z.date().nullable(),
      guessed: z.boolean(),
    })
    .nullable(),
};

const vaultOutputSchemaFull = z.object(vaultOutputSchema);

export type VaultOutputSchemaType = z.infer<typeof vaultOutputSchemaFull>;

export const submitVaultCombinationInputSchema = {
  combination: z
    .number({
      description: 'The combination being submitted by the user to try to unlock the vault',
    })
    .int()
    .min(1)
    .max(999999),
};
