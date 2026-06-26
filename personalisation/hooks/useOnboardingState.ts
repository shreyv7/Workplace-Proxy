import { useState } from "react";
import { supabase } from "../../src/lib/supabase";

export interface OnboardingData {
  cognitiveProfile: string;
  communicationStyle: string;
  peakFocusTime: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  stressTriggers: string[];
  urgencyPreference: string;
}

const INITIAL_STATE: OnboardingData = {
  cognitiveProfile: "",
  communicationStyle: "",
  peakFocusTime: "",
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  stressTriggers: [],
  urgencyPreference: "",
};

export const useOnboardingState = () => {
  const [data, setData] = useState<OnboardingData>(INITIAL_STATE);

  const updateField = (field: keyof OnboardingData, value: any) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0:
        return true; // Step 0 is the typewriter transition, always ready
      case 1:
        return !!data.cognitiveProfile;
      case 2:
        return !!data.communicationStyle;
      case 3:
        return !!data.peakFocusTime;
      case 4:
        return !!data.workingHoursStart && !!data.workingHoursEnd;
      case 5:
        return data.stressTriggers.length > 0;
      case 6:
        return !!data.urgencyPreference;
      default:
        return false;
    }
  };

  const submitAll = async (userId: string) => {
    const isMock = userId.startsWith("mock-");
    
    // Save to localStorage as a fallback/mock database
    localStorage.setItem(`profile_${userId}`, JSON.stringify({ ...data, onboarding_completed: true }));

    // Prepare backend payload
    const payload = {
      user_id: userId,
      cognitive_profile: data.cognitiveProfile,
      communication_style: data.communicationStyle,
      peak_focus_time: data.peakFocusTime,
      working_hours_start: data.workingHoursStart,
      working_hours_end: data.workingHoursEnd,
      stress_triggers: data.stressTriggers,
      urgency_preference: data.urgencyPreference,
      onboarding_completed: true,
    };

    // 1. Save to Supabase (if not mock user)
    if (!isMock) {
      try {
        const { error } = await supabase
          .from("user_profiles")
          .upsert(payload, { onConflict: "user_id" });
        if (error) {
          console.warn("Supabase upsert failed (table might not exist yet):", error);
        }
      } catch (err) {
        console.error("Supabase profile save error:", err);
      }
    }

    // 2. Post to Memory Service
    try {
      const response = await fetch("http://localhost:8001/context/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Memory service returned ${response.status}`);
      }
      console.log("Onboarding data synced with Qdrant memory service.");
    } catch (err) {
      console.error("Memory service sync error:", err);
    }
  };

  return {
    data,
    updateField,
    isStepComplete,
    submitAll,
  };
};
