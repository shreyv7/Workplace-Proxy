import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./auth/useAuth";
import { useOnboardingState } from "./hooks/useOnboardingState";
import { StepProgress } from "./components/StepProgress";
import { TypewriterIntro } from "./steps/TypewriterIntro";
import { CognitiveProfileStep } from "./steps/CognitiveProfileStep";
import { CommunicationStyleStep } from "./steps/CommunicationStyleStep";
import { WorkScheduleStep } from "./steps/WorkScheduleStep";
import { WorkHoursClockStep } from "./steps/WorkHoursClockStep";
import { StressTriggersStep } from "./steps/StressTriggersStep";
import { UrgencyPreferencesStep } from "./steps/UrgencyPreferencesStep";
import { ArrowLeft, ArrowRight, Check, HelpCircle, Loader2, Volume2, VolumeX } from "lucide-react";
import { supabase } from "../src/lib/supabase";

export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, setShowAuthModal } = useAuth();
  const { data, updateField, isStepComplete, submitAll } = useOnboardingState();
  const [currentStep, setCurrentStep] = useState(0); // Starts at 0 (Typewriter Intro)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const [playVideo, setPlayVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const [hasStartedFadeOut, setHasStartedFadeOut] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Check if onboarding is already completed, redirect if so
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const checkProfile = async () => {
        // 1. Check local storage first (quickest, handles mock user)
        const localProfile = localStorage.getItem(`profile_${user.id}`);
        if (localProfile) {
          try {
            const parsed = JSON.parse(localProfile);
            if (parsed.onboarding_completed) {
              navigate({ to: "/dashboard" });
              return;
            }
          } catch (e) {}
        }

        // 2. Check Supabase table
        const isMock = user.id.startsWith("mock-");
        if (!isMock) {
          try {
            const { data, error } = await supabase
              .from("user_profiles")
              .select("onboarding_completed")
              .eq("user_id", user.id)
              .single();
            if (data?.onboarding_completed) {
              navigate({ to: "/dashboard" });
            }
          } catch (e) {
            console.warn("Could not fetch profile for redirect check:", e);
          }
        }
      };
      checkProfile();
    }
  }, [user, isAuthenticated, navigate]);

  // If not authenticated and not loading, redirect to landing page and show auth modal
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/" });
      setShowAuthModal(true);
    }
  }, [isLoading, isAuthenticated, navigate, setShowAuthModal]);

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    try {
      await submitAll(user?.id || "mock-user-1234");
      // Already played video at the start, redirect immediately
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < 6) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setTransitioning(false);
      }, 150); // matches transition time
    } else {
      await handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
        setTransitioning(false);
      }, 150);
    }
  };

  const handleSkip = () => {
    // Fill in default values based on current step
    switch (currentStep) {
      case 1:
        updateField("cognitiveProfile", "prefer_not_to_say");
        break;
      case 2:
        updateField("communicationStyle", "bullet_points");
        break;
      case 3:
        updateField("peakFocusTime", "morning");
        break;
      case 4:
        updateField("workingHoursStart", "09:00");
        updateField("workingHoursEnd", "17:00");
        break;
      case 5:
        updateField("stressTriggers", ["ambiguous_deadlines", "vague_requests"]);
        break;
      case 6:
        updateField("urgencyPreference", "use_context");
        break;
    }
    handleNext();
  };

  const handleSkipAll = async () => {
    // Fill in all remaining defaults
    if (!data.cognitiveProfile) updateField("cognitiveProfile", "prefer_not_to_say");
    if (!data.communicationStyle) updateField("communicationStyle", "bullet_points");
    if (!data.peakFocusTime) {
      updateField("peakFocusTime", "morning");
      updateField("workingHoursStart", "09:00");
      updateField("workingHoursEnd", "17:00");
    }
    if (data.stressTriggers.length === 0) {
      updateField("stressTriggers", ["ambiguous_deadlines", "vague_requests"]);
    }
    if (!data.urgencyPreference) updateField("urgencyPreference", "use_context");

    await handleCompleteOnboarding();
  };  // Render Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#030303] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="text-xs font-mono tracking-widest text-white/50">SECURE SHIELD INITIALIZING...</span>
        </div>
      </div>
    );
  }

  // Render Auth Required message if not logged in (instant redirect to landing page is active)
  if (!isAuthenticated) {
    return null;
  }

  if (playVideo) {
    return (
      <div className="fixed inset-0 z-50 bg-[#030303] flex items-center justify-center overflow-hidden w-screen h-screen">
        <video
          ref={videoRef}
          src="/phone.mp4"
          className="w-full h-full object-cover animate-fade-in"
          autoPlay
          muted={isMuted}
          playsInline
          onPlay={() => {
            // Start 3 second fade-in from black
            setFadeOpacity(0);
          }}
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            if (video.duration && video.duration - video.currentTime <= 3) {
              if (!hasStartedFadeOut) {
                setHasStartedFadeOut(true);
                // Start 3 second fade-out to black
                setFadeOpacity(1);
              }
            }
          }}
          onEnded={() => {
            setPlayVideo(false);
          }}
        />
        {/* Black Fader Overlay */}
        <div 
          className="absolute inset-0 bg-[#030303] pointer-events-none transition-opacity ease-in-out"
          style={{ 
            opacity: fadeOpacity,
            transitionDuration: '3000ms'
          }}
        />
        {/* Mute/Unmute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-6 left-6 z-50 text-[10px] tracking-widest font-mono font-semibold uppercase text-white/50 hover:text-white border border-white/10 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2"
        >
          {isMuted ? (
            <>
              <VolumeX className="h-3.5 w-3.5" /> Unmute
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5" /> Mute
            </>
          )}
        </button>
        {/* Skip Intro Button */}
        <button
          onClick={() => setPlayVideo(false)}
          className="absolute bottom-6 right-6 z-50 text-[10px] tracking-widest font-mono font-semibold uppercase text-white/50 hover:text-white border border-white/10 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
        >
          Skip Intro
        </button>
      </div>
    );
  }

  // Step 0: Typewriter animation (Cinematic black viewport)
  if (currentStep === 0) {
    return <TypewriterIntro onComplete={() => setCurrentStep(1)} />;
  }

  return (
    <div className="relative min-h-screen w-screen bg-[#030303] text-white flex flex-col font-sans select-none overflow-x-hidden py-6 px-6">
      <style>{`
        @keyframes slide-in-fade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in-fade {
          animation: slide-in-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono tracking-widest text-white/40 font-semibold uppercase">
            Workplace Proxy / Onboarding
          </span>
        </div>
        <button
          onClick={handleSkipAll}
          className="text-[10px] tracking-widest font-semibold uppercase text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          Skip Onboarding
        </button>
      </header>

      {/* Progress bar */}
      <StepProgress currentStep={currentStep} totalSteps={6} />

      {/* Main card box */}
      <main className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto my-4">
        <div
          className={`w-full transition-opacity duration-150 ${
            transitioning ? "opacity-0" : "opacity-100 animate-slide-in-fade"
          }`}
        >
          {currentStep === 1 && (
            <CognitiveProfileStep
              value={data.cognitiveProfile}
              onChange={(val) => updateField("cognitiveProfile", val)}
            />
          )}
          {currentStep === 2 && (
            <CommunicationStyleStep
              value={data.communicationStyle}
              onChange={(val) => updateField("communicationStyle", val)}
            />
          )}
          {currentStep === 3 && (
            <WorkScheduleStep
              peakFocusTime={data.peakFocusTime}
              onPeakFocusTimeChange={(val) => updateField("peakFocusTime", val)}
            />
          )}
          {currentStep === 4 && (
            <WorkHoursClockStep
              workingHoursStart={data.workingHoursStart}
              onWorkingHoursStartChange={(val) => updateField("workingHoursStart", val)}
              workingHoursEnd={data.workingHoursEnd}
              onWorkingHoursEndChange={(val) => updateField("workingHoursEnd", val)}
            />
          )}
          {currentStep === 5 && (
            <StressTriggersStep
              selectedTriggers={data.stressTriggers}
              onChange={(val) => updateField("stressTriggers", val)}
            />
          )}
          {currentStep === 6 && (
            <UrgencyPreferencesStep
              value={data.urgencyPreference}
              onChange={(val) => updateField("urgencyPreference", val)}
            />
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="max-w-4xl w-full mx-auto flex items-center justify-between border-t border-white/5 pt-6 flex-shrink-0">
        {/* Back Button */}
        <div>
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
          ) : (
            <div className="w-[84px]" /> // placeholder to balance grid
          )}
        </div>

        {/* Action Buttons: Skip and Next */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2.5 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors cursor-pointer"
          >
            Skip Question
          </button>

          <button
            disabled={!isStepComplete(currentStep) || isSubmitting}
            onClick={handleNext}
            className={`group flex items-center gap-2 rounded-xl px-8 py-3 text-xs font-semibold transition-all duration-300 cursor-pointer ${
              isStepComplete(currentStep) && !isSubmitting
                ? "bg-white text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </>
            ) : currentStep === 6 ? (
              <>
                Complete Onboarding <Check className="h-3.5 w-3.5 stroke-[3]" />
              </>
            ) : (
              <>
                Continue{" "}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
