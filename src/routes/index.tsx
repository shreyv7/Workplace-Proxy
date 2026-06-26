import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Brain, Bot, Calendar, Cpu } from "lucide-react";
import Strands from "../components/Strands";
import { useAuth } from "../../personalisation/auth/useAuth";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workplace Proxy — The Cognitive Operating System" },
      {
        name: "description",
        content:
          "An AI-native multi-agent cognitive workspace that translates ambiguous messages into structured, scheduled actions.",
      },
    ],
  }),
  component: LandingPage,
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithGoogle, loginMock } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // If a valid session already exists, check the profile and route accordingly
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const routeAfterAuth = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("onboarding_completed")
            .eq("user_id", session.user.id)
            .single();
          navigate({
            to: profile?.onboarding_completed ? "/dashboard" : "/onboarding",
            replace: true,
          });
        } catch {
          navigate({ to: "/dashboard", replace: true });
        }
      };
      routeAfterAuth();
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleGoogleSignIn = async () => {
    setSignInError(null);
    setSigningIn(true);
    try {
      await loginWithGoogle();
      // Page navigates away via OAuth redirect — code below only runs if redirect is blocked
    } catch (err: any) {
      setSignInError(err?.message ?? "Google sign-in failed. Please try again.");
      setSigningIn(false);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-[#030303] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Background WebGL Animation */}
      <div className="absolute inset-x-0 -top-20 z-0 h-[calc(100%+5rem)] w-full">
        <Strands
          colors={["#00F2FE", "#7C3AED", "#EC4899", "#10B981"]}
          count={5}
          speed={0.25}
          amplitude={1.8}
          waviness={0.8}
          thickness={1.2}
          glow={2.8}
          taper={2.5}
          spread={1.2}
          intensity={0.65}
          saturation={1.5}
          opacity={0.85}
          scale={1.9}
          glass={false}
        />
        <div className="absolute inset-0 bg-[#030303]/60 backdrop-blur-[1px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(3,3,3,0.1)_0%,rgba(3,3,3,0.95)_85%)] pointer-events-none" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/5 bg-[#030303]/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Sparkles className="h-4.5 w-4.5 text-black" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Workplace Proxy</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="group flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Launch App
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-4 md:px-12 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/20 px-3 py-0.5 text-xs text-cyan-300 font-mono mb-4 animate-fade-in shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <Cpu className="h-3 w-3 animate-pulse" />
          <span>Google Agent Labs Hackathon '26</span>
        </div>

        {/* Hero Heading */}
        <div className="text-center max-w-2xl space-y-3 mb-6">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent leading-[1.15]">
            The cognitive shell for deep work
          </h1>
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed">
            Workplace Proxy is an AI-native workspace. It continuously ingests, interprets, and debates messy signals from Slack, Jira, and Email, translating them into structured schedule blocks.
          </p>
        </div>

        {/* Hero CTA */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs mb-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="relative group flex items-center justify-center gap-3 w-full rounded-xl bg-white text-gray-900 px-6 py-3 text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,255,255,0.22)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {signingIn ? (
              <span className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            {signingIn ? "Redirecting…" : "Continue with Google"}
          </button>

          {signInError && (
            <p className="text-center text-xs text-red-400 px-2">{signInError}</p>
          )}

          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/30 font-mono tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={() => loginMock()}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-medium text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white/80"
          >
            Launch Demo Workspace
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
          {/* Card 1 */}
          <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#080808]/40 p-5 md:p-6 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-[#0a0a0a]/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-400 border border-white/5 mb-4 group-hover:scale-105 transition-transform duration-300">
              <Bot className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold mb-1.5">Swarm Intelligence</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Autonomous agents intercept, translate, and debate incoming ambiguous signals. No raw text or notifications ever reach you directly.
            </p>
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>

          {/* Card 2 */}
          <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#080808]/40 p-5 md:p-6 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-[#0a0a0a]/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-purple-400 border border-white/5 mb-4 group-hover:scale-105 transition-transform duration-300">
              <Calendar className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold mb-1.5">Cognitive Scheduling</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Visualizes your daily mental bandwidth. Protects focus hours, reserves context-switching buffer, and automatically blocks calendar slots.
            </p>
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>

          {/* Card 3 */}
          <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#080808]/40 p-5 md:p-6 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-[#0a0a0a]/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-emerald-400 border border-white/5 mb-4 group-hover:scale-105 transition-transform duration-300">
              <Brain className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold mb-1.5">Vector Context Memory</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              A high-precision semantic knowledge store backed by Qdrant. Saves working relationships, preferred formats, and organization context.
            </p>
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex-shrink-0 w-full text-center py-4 text-xs text-white/35 border-t border-white/5 bg-[#030303]/60 backdrop-blur-sm mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 md:px-12 max-w-7xl mx-auto w-full gap-4">
          <span>&copy; {new Date().getFullYear()} Workplace Proxy. All rights reserved.</span>
          <div className="flex gap-4">
            <span>Powered by Google ADK &amp; Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
