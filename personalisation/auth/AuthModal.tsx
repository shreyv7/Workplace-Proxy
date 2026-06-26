import React from "react";
import { useAuth } from "./useAuth";
import { Sparkles, X } from "lucide-react";

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, loginWithGoogle, loginMock } = useAuth();

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setShowAuthModal(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]/80 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center mt-2">
          {/* Logo Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-4">
            <Sparkles className="h-6 w-6 text-black" strokeWidth={2} />
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">Launch Workspace</h3>
          <p className="mt-2 text-xs text-white/50 max-w-xs leading-relaxed">
            Connect your account to access your neuro-inclusive cognitive workspace proxy.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={loginWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20 active:scale-[0.98] cursor-pointer"
          >
            {/* Google Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[10px] text-white/30 tracking-widest font-mono">OR</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button
            onClick={loginMock}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98] cursor-pointer"
          >
            Launch Demo Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
