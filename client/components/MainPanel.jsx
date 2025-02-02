    import { useEffect, useRef } from 'react';
import ChatPanel from './ChatPanel';

const MainPanel = ({ transcript, currentStep, steps, onSendMessage }) => {
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <main className="flex-1 flex flex-col">
      <header className="border-b p-4">
        <h1 className="text-lg font-semibold">
          {currentStep > -1 ? steps[currentStep].title : "Welcome to Voice Assistant"}
        </h1>
      </header>

      <section className="flex-1 overflow-auto p-4 space-y-4">
        <div className="space-y-2">
          {transcript.split('\n').map((line, i) => (
            <p key={i} className="p-2 bg-gray-50 rounded-lg">
              {line}
            </p>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </section>

      <ChatPanel onSendMessage={onSendMessage} />
    </main>
  );
};

export default MainPanel; 