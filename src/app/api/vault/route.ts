'use server';

import { NextResponse } from 'next/server';
import { handleRequest } from '@/lib/handle-request';
import { Vault } from '@/server/models/vault';
import { VaultGuess } from '@/server/models/vault-guess';

export const GET = handleRequest(async () => {
  // Get the latest vault
  const vault = await Vault.findOne({
    order: [['createdAt', 'DESC']],
  });
  if (!vault) {
    return NextResponse.json({ error: 'No vault info currently available' }, { status: 404 });
  }

  // Get all guessed keys for this vault
  const vaultGuesses = (await VaultGuess.findAll({
    attributes: ['key'],
    where: {
      vaultId: vault.id,
    },
  })) as Pick<VaultGuess, 'key'>[];

  // Get the winning vault guess if it exists
  const winningVaultGuess =
    (vault.winningVaultGuessId &&
      (await VaultGuess.findOne({
        where: {
          id: vault.winningVaultGuessId,
        },
      }))) ||
    null;

  // Return the vault info without exposing the key
  return NextResponse.json({
    data: {
      name: vault.name,
      value: vault.value,
      min: vault.min,
      max: vault.max,
      guesses: vaultGuesses.map(guess => guess.key),
      winningVaultGuess: winningVaultGuess?.key,
    },
  });
});
