import useVoiceConnection from '../hooks/useVoiceConnection';

export default function App() {
  const { 
    isSessionActive,
    transcript,
    startSession,
    stopSession
  } = useVoiceConnection();

  return (
    <div className="app-container">
      <div className="controls">
        {!isSessionActive ? (
          <button onClick={startSession} disabled={isSessionActive}>
            Connect
          </button>
        ) : (
          <button onClick={stopSession} disabled={!isSessionActive}>
            Disconnect
          </button>
        )}
      </div>

      <div className="transcript-box">
        {transcript || "Waiting for input..."}
      </div>
    </div>
  );
}
