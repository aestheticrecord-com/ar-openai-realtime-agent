import { Radio, Volume2, VolumeX, Check } from 'react-feather';

export const ConnectionButton = ({ isConnected, toggleConnection }) => (
  <button
    onClick={toggleConnection}
    className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg ${
      isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
    }`}
  >
    <Radio className={`h-4 w-4 ${isConnected ? 'animate-pulse' : ''}`} />
    <span className="font-medium">
      {isConnected ? 'Connected' : 'Connect Assistant'}
    </span>
    {isConnected ? <Volume2 size={16} /> : <VolumeX size={16} />}
  </button>
);

const StepList = ({ steps, currentStep }) => (
  <nav aria-label="Progress steps" className="space-y-1">
    {steps.map((step, index) => (
      <div
        key={step.id}
        role="button"
        tabIndex={0}
        className={`flex items-center p-3 rounded-lg cursor-pointer ${
          currentStep === index ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
        }`}
      >
        <div 
          className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 
            ${step.completed ? 'bg-green-100 text-green-700' : 
              currentStep === index ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
          aria-hidden="true"
        >
          {step.completed ? <Check size={14} /> : index + 1}
        </div>
        <span className="text-sm font-medium">{step.title}</span>
      </div>
    ))}
  </nav>
);

const Sidebar = ({ isConnected, currentStep, steps, toggleConnection }) => (
  <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
    <div className="mb-6">
      <ConnectionButton 
        isConnected={isConnected} 
        toggleConnection={toggleConnection} 
      />
    </div>
    <StepList steps={steps} currentStep={currentStep} />
  </aside>
);

export default Sidebar; 