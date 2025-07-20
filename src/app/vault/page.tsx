'use client';

import { useVault } from '../lib/vault';
import { Button } from '../_components/Button';
import { Modal } from '../_components/Modal';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useCallback } from 'react';

export default function VaultPage() {
  const { vault, query } = useVault();
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Generate all possible guesses between min and max
  const allPossibleGuesses = [];
  for (let i = vault?.min || 0; i <= (vault?.max || 0); i++) {
    allPossibleGuesses.push(i);
  }

  // Create a set of guessed values for efficient lookup
  const guessedValues = new Set(vault?.guesses || []);

  const renderGuessItem = useCallback(
    (guess: number) => {
      const isGuessed = guessedValues.has(guess);
      const isWinningGuess = vault?.winningVaultGuess === guess;

      return (
        <div
          className={`
          p-2 text-center rounded-md text-sm font-medium transition-colors
          ${
            isWinningGuess
              ? 'bg-green-100 text-green-800 border border-green-200'
              : isGuessed
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }
        `}
          title={
            isWinningGuess
              ? `WINNER: ${guess}`
              : isGuessed
              ? `Guessed: ${guess}`
              : `Available: ${guess}`
          }
        >
          {guess}
        </div>
      );
    },
    [guessedValues, vault?.winningVaultGuess]
  );

  if (query.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vault information...</p>
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <Image
              alt="ChipGPT"
              className="rounded-full mx-auto"
              width={80}
              height={80}
              src="/chipgpt-logo.png"
            />
          </div>
          <h1 className="text-2xl font-bold mb-4">Vault Unavailable</h1>
          <p className="text-gray-600 mb-6">
            {query.error?.message || 'No vault is currently available to open.'}
          </p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <Image
              alt="ChipGPT"
              className="rounded-full mx-auto"
              width={80}
              height={80}
              src="/chipgpt-logo.png"
            />
          </div>
          <h1 className="text-2xl font-bold mb-4">No Vault Found</h1>
          <p className="text-gray-600 mb-6">There is currently no vault available to display.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Image
              alt="ChipGPT"
              className="rounded-full mx-auto"
              width={80}
              height={80}
              src="/chipgpt-logo.png"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Vault Information</h1>
          <p className="text-gray-600">Current vault status and details</p>
        </div>

        {/* Winning Guess Display */}
        {vault.winningVaultGuess && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6 mb-6 text-center">
            <div className="mb-2">
              <span className="text-2xl font-bold">🎉 WINNER! 🎉</span>
            </div>
            <div className="text-4xl font-bold mb-2">{vault.winningVaultGuess}</div>
            <p className="text-green-100 text-lg">The vault has been unlocked!</p>
          </div>
        )}

        {/* Vault Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Vault Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vault Name</label>
              <p className="text-lg font-semibold text-gray-900">{vault.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vault Value</label>
              <p className="text-lg font-semibold text-green-600">
                ${vault.value.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Guess</label>
              <p className="text-lg font-semibold text-gray-900">{vault.min}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Guess</label>
              <p className="text-lg font-semibold text-gray-900">{vault.max}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons and Last Updated */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 w-full">
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => query.refetch()}
              disabled={query.isRefetching}
              className="flex items-center justify-center gap-2"
            >
              {query.isRefetching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                'Refresh Data'
              )}
            </Button>
            <Button
              onClick={() => setIsHowItWorksOpen(true)}
              variant="ghost"
              className="flex items-center justify-center gap-2 border border-black text-black hover:bg-black hover:text-white"
            >
              How it Works
            </Button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center mb-6 text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>

        {/* All Possible Guesses Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">All Possible Guesses</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Showing all possible guesses from {vault.min} to {vault.max}
            </p>
            <p className="text-sm text-gray-600">
              Guessed: {vault.guesses.length} | Remaining:{' '}
              {allPossibleGuesses.length - vault.guesses.length}
            </p>
          </div>

          <div className="mb-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Winner</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span>Guessed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span>Available</span>
            </div>
          </div>

          <VirtualGrid
            items={allPossibleGuesses}
            renderItem={renderGuessItem}
            itemHeight={40}
            containerHeight={400}
            columns={6}
          />
        </div>
      </div>

      {/* How it Works Modal */}
      <Modal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        title="How to Unlock the Vault"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Step 1: Connect to the Vault MCP Server</h3>
            <p className="text-gray-600 text-sm">
              Connect to the Vault MCP server at{' '}
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm font-mono text-gray-800">https://mcp.chipgpt.biz/mcp/vault</p>
              </div>
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Step 2: Sign Up/Log In</h3>
            <p className="text-gray-600 text-sm">
              Sign up or log in to your account and verify that you are a human through the
              authentication process.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Step 3: Submit Your Daily Guess</h3>
            <p className="text-gray-600 text-sm">
              Every day, you can submit a number to try to unlock the vault. Simply prompt the AI
              with something like:
            </p>
            <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-sm font-mono text-gray-800">
                "try to open the vault using combination 37746"
              </p>
            </div>
            <p className="text-gray-600 text-sm">Choose your guess wisely!</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Step 4: Track Progress</h3>
            <p className="text-gray-600 text-sm">
              Visit the website{' '}
              <Link
                href="https://chipgpt.biz/vault"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                https://chipgpt.biz/vault
              </Link>{' '}
              to view which numbers have already been guessed and track the progress of the vault
              unlocking.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Virtual Grid Component
function VirtualGrid({
  items,
  renderItem,
  itemHeight = 40,
  containerHeight = 400,
  columns = 12,
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  columns?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const rowsPerView = Math.ceil(containerHeight / itemHeight);
  const totalRows = Math.ceil(items.length / columns);

  const startRow = Math.floor(scrollTop / itemHeight);
  const endRow = Math.min(startRow + rowsPerView + 1, totalRows);

  const visibleItems = useMemo(() => {
    const startIndex = startRow * columns;
    const endIndex = Math.min(endRow * columns, items.length);
    return items.slice(startIndex, endIndex);
  }, [items, startRow, endRow, columns]);

  const totalHeight = totalRows * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className="overflow-auto border border-gray-200 rounded-md w-full"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative', width: '100%' }}>
        <div
          style={{
            position: 'absolute',
            top: startRow * itemHeight,
            left: 0,
            right: 0,
            width: '100%',
          }}
        >
          <div
            className="grid gap-2 w-full"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              height:
                visibleItems.length > 0 ? Math.ceil(visibleItems.length / columns) * itemHeight : 0,
            }}
          >
            {visibleItems.map((item, index) => {
              const actualIndex = startRow * columns + index;
              return (
                <div key={actualIndex} style={{ height: itemHeight, minWidth: 0 }}>
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
