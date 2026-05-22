
import React from 'react';

interface TriageProps {
  questions: string[];
  suggestedAnswers: string[];
  onSelect: (answer: string) => void;
}

export const TriageCard: React.FC<TriageProps> = ({ questions, suggestedAnswers, onSelect }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl rounded-tl-none max-w-xl animate-in slide-in-from-left-4 duration-500">
      <div className="flex items-center space-x-2 text-primary dark:text-teal-400 mb-4">
        <span className="material-icons-round text-xl">clinical_notes</span>
        <p className="text-sm font-bold uppercase tracking-wider">Triage Analysis</p>
      </div>
      
      <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200 mb-4 font-medium">
        To better understand your situation, please answer these quick questions:
      </p>

      <div className="space-y-3 mb-6">
        {questions.map((q, i) => (
          <div key={i} className="flex items-center space-x-3 text-sm bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="material-icons-round text-primary text-xl">help_outline</span>
            <span className="text-slate-600 dark:text-slate-300">{q}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestedAnswers.map((answer, i) => (
          <button
            key={i}
            onClick={() => onSelect(answer)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm"
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
};
