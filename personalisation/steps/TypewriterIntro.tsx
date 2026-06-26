import React, { useEffect, useState } from "react";

interface TypewriterIntroProps {
  onComplete: () => void;
}

export const TypewriterIntro: React.FC<TypewriterIntroProps> = ({ onComplete }) => {
  const fullText = "help us know you better...";
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  // Robust slice-based typewriter effect (resilient to React double-renders)
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 100); // 100ms per letter
      return () => clearTimeout(timeout);
    } else {
      setIsDone(true);
    }
  }, [displayedText]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 bg-[#030303] flex flex-col items-center justify-center cursor-pointer select-none z-50 animate-fade-in"
    >
      <style>{`
        @keyframes caret-blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .animate-caret-blink {
          animation: caret-blink 0.8s infinite;
        }
        @keyframes soft-glow {
          0%, 100% { 
            opacity: 0.3; 
            text-shadow: 0 0 4px rgba(6,182,212,0.1); 
          }
          50% { 
            opacity: 0.8; 
            text-shadow: 0 0 12px rgba(6,182,212,0.7); 
          }
        }
        .animate-soft-glow {
          animation: soft-glow 2.5s infinite ease-in-out;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-mono text-white tracking-widest font-light text-center">
          {displayedText}
          <span className="inline-block w-[3px] h-6 sm:h-8 ml-1.5 bg-white animate-caret-blink align-middle" />
        </h1>

        {/* Glow subtext - fades in and pulses only after typing completes */}
        <div
          className={`text-[9px] sm:text-xs font-mono tracking-widest text-cyan-400/90 transition-all duration-1000 ${
            isDone ? "opacity-100 translate-y-0 animate-soft-glow" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          CLICK ANYWHERE TO CONTINUE
        </div>
      </div>
    </div>
  );
};


