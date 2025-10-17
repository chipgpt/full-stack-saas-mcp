import { createRoot } from 'react-dom/client';
import { FullscreenIcon, MinimizeIcon, RefreshCwIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useOpenAiGlobal } from '..';

interface IUserProfile {
  id: string;
  email: string;
  context: string;
}

function App() {
  const maxHeight = useOpenAiGlobal('maxHeight');
  const widgetState = useOpenAiGlobal('widgetState') as { profile: IUserProfile } | null;
  const userAgent = useOpenAiGlobal('userAgent');
  const toolResponseMetadata = useOpenAiGlobal('toolResponseMetadata') as {} | null;
  const toolOutput = useOpenAiGlobal('toolOutput') as { profile: IUserProfile } | null;
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
  const [profile, setProfile] = useState<IUserProfile | null>(null);

  const activeProfile = profile || widgetState?.profile || toolOutput?.profile || null;

  const onRefresh = async () => {
    setLoading(true);
    const result = await window.openai
      .callTool<{ profile: IUserProfile }>('get-profile', { ...toolInput })
      .catch(console.error);
    setLoading(false);

    if (setWidgetState && result) {
      await setWidgetState({ profile: result.structuredContent.profile });
      setProfile(result.structuredContent.profile);
    }
  };

  const onDisplayModeChange = () => {
    window.openai.requestDisplayMode({
      mode: displayMode === 'fullscreen' ? 'inline' : 'fullscreen',
    });
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
      {activeProfile && (
        <div className="flex flex-col flex-1 gap-5 items-center justify-center p-5">
          <div>
            <strong>Account:</strong> {activeProfile.email}
          </div>
          <div>
            <strong>Context:</strong> {activeProfile.context}
          </div>
        </div>
      )}
    </div>
  );
}

const element = document.getElementById('chipgpt-profile-root');
if (element) {
  createRoot(element).render(<App />);
}
