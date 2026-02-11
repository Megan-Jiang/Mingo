import React from 'react';
import { Mic, MicOff } from 'lucide-react';

const RecordButton = ({ isRecording, recordingTime, onStart, onStop }) => {
  return (
    <div className="relative">
      <button
        onClick={isRecording ? onStop : onStart}
        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-[#fcd753] hover:bg-[#e6c24a]'
        } shadow-lg hover:shadow-xl`}
      >
        {isRecording ? (
          <MicOff className="h-8 w-8 text-white" />
        ) : (
          <Mic className="h-8 w-8 text-white" />
        )}
      </button>
      
      {isRecording && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
      )}
    </div>
  );
};

export default RecordButton;
