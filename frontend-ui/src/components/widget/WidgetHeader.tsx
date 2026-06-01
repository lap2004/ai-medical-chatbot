
import React from 'react';
export const WidgetHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="p-5 bg-primary rounded-t-3xl text-white relative">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
          alt="AI Doctor Avatar"
          className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
          src="https://ui-avatars.com/api/?name=Doctor+AI"
        />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary rounded-full"></div>
        </div>
        <div>
          <h4 className="font-bold flex items-center gap-1">Doctor <span className="bg-white/20 text-[10px] px-1 rounded">AI</span></h4>
          <p className="text-xs text-white/70">Medical Assistant</p>
        </div>
      </div>
      <button 
        onClick={onClose}
        className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors"
      >
        <span className="material-icons-round">close</span>
      </button>
    </div>
  );
};
