import { useState } from 'react';
import useVoiceConnection from '../hooks/useVoiceConnection';
import Sidebar from './Sidebar';
import MainPanel from './MainPanel';

const initialSteps = [
  { id: 1, title: 'Account Setup', completed: false },
  { id: 2, title: 'Clinic Details', completed: false },
];

const App = () => {
  const { 
    isSessionActive,
    transcript,
    startSession,
    stopSession,
    sendMessage
  } = useVoiceConnection();
  
  const [currentStep, setCurrentStep] = useState(-1);
  const [steps] = useState(initialSteps);

  return (
    <div className="h-screen flex">
      <Sidebar
        isConnected={isSessionActive}
        currentStep={currentStep}
        steps={steps}
        toggleConnection={isSessionActive ? stopSession : startSession}
      />
      
      <MainPanel 
        currentStep={currentStep}
        steps={steps}
        transcript={transcript}
        onSendMessage={sendMessage}
      />
    </div>
  );
};

export default App;
