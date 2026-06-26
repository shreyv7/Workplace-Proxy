import React from "react";
import { Timepicker } from "timepicker-ui-react";
import "timepicker-ui/main.css";
import { Clock } from "lucide-react";

interface WorkHoursClockStepProps {
  workingHoursStart: string;
  onWorkingHoursStartChange: (value: string) => void;
  workingHoursEnd: string;
  onWorkingHoursEndChange: (value: string) => void;
}

export const WorkHoursClockStep: React.FC<WorkHoursClockStepProps> = ({
  workingHoursStart,
  onWorkingHoursStartChange,
  workingHoursEnd,
  onWorkingHoursEndChange,
}) => {
  // Convert "09:00" (24h) to "09:00 AM" (12h)
  const to12h = (time24: string): string => {
    if (!time24) return "09:00 AM";
    const [hStr, mStr] = time24.split(":");
    const h24 = parseInt(hStr || "9", 10);
    const min = mStr || "00";
    const period = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12.toString().padStart(2, "0")}:${min.padStart(2, "0")} ${period}`;
  };

  // Convert callback data back to "HH:MM" (24h)
  const handleStartUpdate = (data: any) => {
    const period = data.type.toUpperCase();
    let hr = parseInt(data.hour, 10);
    const min = data.minutes.padStart(2, "0");
    
    if (period === "PM" && hr < 12) hr += 12;
    if (period === "AM" && hr === 12) hr = 0;
    
    const time24 = `${hr.toString().padStart(2, "0")}:${min}`;
    onWorkingHoursStartChange(time24);
  };

  const handleEndUpdate = (data: any) => {
    const period = data.type.toUpperCase();
    let hr = parseInt(data.hour, 10);
    const min = data.minutes.padStart(2, "0");
    
    if (period === "PM" && hr < 12) hr += 12;
    if (period === "AM" && hr === 12) hr = 0;
    
    const time24 = `${hr.toString().padStart(2, "0")}:${min}`;
    onWorkingHoursEndChange(time24);
  };

  const startPickerRef = React.useRef<HTMLInputElement>(null);
  const endPickerRef = React.useRef<HTMLInputElement>(null);

  const themeOptions = {
    ui: {
      theme: "dark",
    },
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Define your core working hours</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          Set your core working window. Click the inputs below to open the interactive clock selection dial.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-xl mx-auto pt-6">
        {/* Start Time Timepicker */}
        <div className="w-full space-y-2 text-center">
          <label className="text-[10px] font-mono tracking-widest text-white/40 uppercase font-semibold block">
            Start Time
          </label>
          <div 
            onClick={() => startPickerRef.current?.click()}
            className="relative group flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-4 py-3 cursor-pointer"
          >
            <Clock className="h-4 w-4 text-cyan-400" />
            <Timepicker
              ref={startPickerRef}
              value={to12h(workingHoursStart)}
              onUpdate={handleStartUpdate}
              options={themeOptions}
              className="bg-transparent border-none text-sm font-semibold font-mono text-white focus:outline-none text-center cursor-pointer w-24"
            />
          </div>
        </div>

        {/* End Time Timepicker */}
        <div className="w-full space-y-2 text-center">
          <label className="text-[10px] font-mono tracking-widest text-white/40 uppercase font-semibold block">
            End Time
          </label>
          <div 
            onClick={() => endPickerRef.current?.click()}
            className="relative group flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-4 py-3 cursor-pointer"
          >
            <Clock className="h-4 w-4 text-blue-400" />
            <Timepicker
              ref={endPickerRef}
              value={to12h(workingHoursEnd)}
              onUpdate={handleEndUpdate}
              options={themeOptions}
              className="bg-transparent border-none text-sm font-semibold font-mono text-white focus:outline-none text-center cursor-pointer w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
