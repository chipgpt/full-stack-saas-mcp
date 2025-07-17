'use client';

import { signIn, useSession } from 'next-auth/react';
import { useOAuthClient } from '../lib/oauth';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import { Checkbox } from '../_components/Checkbox';
import { flatten } from 'lodash';

export default function Authorize() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Main Content Card */}
      <OAuthAuthorizeSuspense />
    </div>
  );
}

function OAuthAuthorizeSuspense() {
  return (
    <Suspense fallback={<div />}>
      <OAuthAuthorize />
    </Suspense>
  );
}

function OAuthAuthorize() {
  const session = useSession();
  const searchParams = useSearchParams();

  const authorize = async (selectedScopes: string[]) => {
    // Build new search params with selected scopes
    const params = new URLSearchParams(location.search);
    params.set('scope', selectedScopes.join(' '));
    location.href = `/api/oauth/authorize?${params.toString()}&state=12345`;
  };

  const { oauthClient } = useOAuthClient({ id: searchParams.get('client_id') || '' });

  // Parse requested scopes from the URL
  const scopeParam = searchParams.get('scope') || '';
  const requestedScopes = flatten(
    scopeParam
      .split(' ')
      .filter(Boolean)
      .map(scope => scope.split('+'))
  );

  const scopes = [
    { value: 'read', label: 'Allow application to read your profile' },
    { value: 'write', label: 'Allow application to update your profile' },
  ];

  // State for selected scopes
  const [selectedScopes, setSelectedScopes] = React.useState<string[]>(requestedScopes);

  const handleScopeChange = (scope: string, checked: boolean) => {
    if (scope === 'read') {
      if (!checked) {
        // If unchecking 'read', also uncheck 'write'
        setSelectedScopes(prev => prev.filter(s => s !== 'read' && s !== 'write'));
      } else {
        setSelectedScopes(prev => (prev.includes('read') ? prev : [...prev, 'read']));
      }
    } else if (scope === 'write') {
      if (checked) {
        // If checking 'write', ensure 'read' is also checked
        setSelectedScopes(prev => {
          const next = [...prev];
          if (!next.includes('read')) next.push('read');
          if (!next.includes('write')) next.push('write');
          return next;
        });
      } else {
        setSelectedScopes(prev => prev.filter(s => s !== 'write'));
      }
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center relative z-10">
      <div className="w-full max-w-lg mx-auto p-8 rounded-2xl shadow-2xl border flex flex-col items-center gap-8">
        {session.status === 'loading' || !oauthClient ? (
          <div className="text-lg font-semibold">Loading...</div>
        ) : session.data?.user ? (
          <div className="flex flex-col gap-6 items-center w-full">
            <p className="text-2xl text-center">
              <a href={oauthClient.uri} target="_blank" rel="noopener noreferrer">
                <strong>{oauthClient.name}</strong>
              </a>
              <br />
              is requesting access to your account.
            </p>
            {/* Scopes Section */}
            <div className="w-full mb-2 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Permissions</h3>
              <ul className="space-y-2">
                {scopes.map(scope => (
                  <li key={scope.value}>
                    <Checkbox
                      name={scope.value}
                      label={scope.label}
                      value={selectedScopes.includes(scope.value)}
                      onChangeChecked={checked => handleScopeChange(scope.value, checked)}
                      disabled={scope.value === 'write' && !selectedScopes.includes('read')}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => authorize(selectedScopes)}
              className="text-lg font-semibold flex items-center gap-2 px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all duration-200 w-full justify-center border"
              disabled={selectedScopes.length === 0}
            >
              Approve Access
            </button>
            <p className="text-sm text-gray-400 text-center">
              {!oauthClient.redirectUris[0].startsWith('https') &&
                !oauthClient.redirectUris[0].startsWith('http://localhost:') &&
                !oauthClient.redirectUris[0].startsWith('http://localhost/') && (
                  <span className="text-red-500">
                    This URL is not secure and may expose your access token
                    <br />
                  </span>
                )}
              You will be redirected to the following URL after approval:{' '}
              <a href={oauthClient.redirectUris[0]} target="_blank" rel="noopener noreferrer">
                {oauthClient.redirectUris[0]}
              </a>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => signIn('cognito', { redirectTo: `/authorize${location.search}` })}
            className="text-lg font-semibold flex items-center gap-2 px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all duration-200 w-full justify-center border"
          >
            Log in
          </button>
        )}
      </div>
    </main>
  );
}
