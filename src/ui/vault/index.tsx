import { createRoot } from 'react-dom/client';
import { FullscreenIcon, MinimizeIcon, RefreshCwIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useOpenAiGlobal } from '..';

interface IVault {
  id: string;
  name: string;
  min: number;
  max: number;
  value: number;
  openedAt: Date | null;
  guessed: boolean;
}

function App() {
  const maxHeight = useOpenAiGlobal('maxHeight');
  const widgetState = useOpenAiGlobal('widgetState') as { vault: IVault } | null;
  const userAgent = useOpenAiGlobal('userAgent');
  const toolResponseMetadata = useOpenAiGlobal('toolResponseMetadata') as {} | null;
  const toolOutput = useOpenAiGlobal('toolOutput') as { vault: IVault } | null;
  const toolInput = useOpenAiGlobal('toolInput') as {} | null;
  const theme = useOpenAiGlobal('theme');
  const safeArea = useOpenAiGlobal('safeArea');
  const displayMode = useOpenAiGlobal('displayMode');
  const setWidgetState = useOpenAiGlobal('setWidgetState');

  console.log('maxHeight', maxHeight);
  console.log('widgetState', widgetState);
  console.log('userAgent', userAgent);
  console.log('toolResponseMetadata', toolResponseMetadata);
  console.log('toolOutput', toolOutput);
  console.log('toolInput', toolInput);
  console.log('theme', theme);
  console.log('safeArea', safeArea);
  console.log('displayMode', displayMode);

  const [loading, setLoading] = useState(false);
  const [vault, setVault] = useState<IVault | null>(null);
  const [guess, setGuess] = useState<string>('');

  const activeVault = vault || widgetState?.vault || toolOutput?.vault || null;

  const onRefresh = async () => {
    setLoading(true);
    const result = await window.openai
      .callTool<{ vault: IVault }>('get-vault', { ...toolInput })
      .catch(console.error);
    setLoading(false);

    if (setWidgetState && result && 'vault' in result.structuredContent) {
      await setWidgetState({ vault: result.structuredContent.vault });
      setVault(result.structuredContent.vault);
    }
  };

  const onDisplayModeChange = () => {
    window.openai.requestDisplayMode({
      mode: displayMode === 'fullscreen' ? 'inline' : 'fullscreen',
    });
  };

  const onGuess = async () => {
    setLoading(true);
    const result = await window.openai
      .callTool('submit-vault-combination', { combination: Number(guess) })
      .catch(console.error);

    if (result && 'success' in result.structuredContent) {
      const result = await window.openai
        .callTool<{ vault: IVault }>('get-vault', { ...toolInput })
        .catch(console.error);

      if (setWidgetState && result && 'vault' in result.structuredContent) {
        await setWidgetState({ vault: result.structuredContent.vault });
        setVault(result.structuredContent.vault);
      }
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: safeArea?.insets.top || 0,
        left: safeArea?.insets.left || 0,
        right: safeArea?.insets.right || 0,
        bottom: safeArea?.insets.bottom || 0,
      }}
      className="flex flex-col"
    >
      <div className="flex flex-row gap-5 pt-5 pr-5 pl-5">
        <button onClick={onRefresh} disabled={loading} title="Refresh list">
          <RefreshCwIcon size={18} className={loading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={onDisplayModeChange}
          title={
            displayMode === 'fullscreen' ? 'Switch to inline mode' : 'Switch to fullscreen mode'
          }
        >
          {displayMode === 'fullscreen' ? <MinimizeIcon size={18} /> : <FullscreenIcon size={18} />}
        </button>
      </div>
      {activeVault && (
        <div className="flex flex-col flex-1 gap-5 items-center justify-center p-5">
          <div>
            <strong>Vault Name:</strong> {activeVault.name}
          </div>
          <div>
            <strong>Vault Value:</strong>{' '}
            {activeVault.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
          <div>
            <strong>Combination Range:</strong> {activeVault.min} - {activeVault.max}
          </div>
          {activeVault.guessed ? (
            <div>
              <strong>You've already guessed this hour</strong> You can guess again next hour.
            </div>
          ) : (
            <div>
              <div>
                <strong>Guess the combination:</strong>
              </div>
              <div>
                <input
                  type="number"
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  min={activeVault.min}
                  max={activeVault.max}
                />
              </div>
              <button onClick={onGuess}>Guess</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const element = document.getElementById('chipgpt-vault-root');
if (element) {
  createRoot(element).render(<App />);
}
