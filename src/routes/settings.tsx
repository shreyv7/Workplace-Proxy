import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Settings, Shield, Key, User, Bell, Check, Loader2 } from "lucide-react";
import { useAuth } from "../../personalisation/auth/useAuth";
import { supabase } from "../lib/supabase";
import { getRuntimeSnapshot, updateDebugSettings } from "../lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — Workplace Proxy" },
      {
        name: "description",
        content: "Configure profile defaults, swarm thresholds, and secure vector API credentials.",
      },
    ],
  }),
  component: SystemSettingsPage,
});

function SystemSettingsPage() {
  const { user } = useAuth();
  const [userName, setUserName] = useState("Hackathon Developer");
  const [userEmail, setUserEmail] = useState("dev@workplaceproxy.ai");
  const [threshold, setThreshold] = useState(90); // Swarm consensus threshold
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Hackathon Developer");
      setUserEmail(user.email ?? "dev@workplaceproxy.ai");
    }
  }, [user]);

  useEffect(() => {
    const loadConsensusSettings = async () => {
      const localThreshold = localStorage.getItem("system_settings_threshold");
      if (localThreshold) {
        setThreshold(parseInt(localThreshold, 10));
        return;
      }

      try {
        const runtime = await getRuntimeSnapshot();
        if (runtime) {
          const consensus = runtime.consensus_threshold;
          const maxRounds = runtime.max_debate_rounds;
          if (consensus === 1) {
            setThreshold(50); // Relaxed
          } else if (consensus === 2 && maxRounds <= 3) {
            setThreshold(75); // Balanced
          } else {
            setThreshold(90); // Strict
          }
        }
      } catch (e) {
        console.warn("Failed to load runtime snapshot for consensus parameters:", e);
      }
    };

    loadConsensusSettings();
  }, []);

  const triggerSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      if (user) {
        const isMock = user.id?.startsWith("mock-");
        if (!isMock) {
          const updates: { email?: string; data?: { full_name?: string } } = {};
          if (userEmail !== user.email) {
            updates.email = userEmail;
          }
          if (userName !== user.user_metadata?.full_name) {
            updates.data = { full_name: userName };
          }

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase.auth.updateUser(updates);
            if (error) throw error;
          }
        } else {
          const mockUser = {
            ...user,
            email: userEmail,
            user_metadata: {
              ...user.user_metadata,
              full_name: userName,
            },
          };
          localStorage.setItem("mock_user", JSON.stringify(mockUser));
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }

      let backendConsensus = 2;
      let backendRounds = 3;

      if (threshold < 70) {
        backendConsensus = 1;
        backendRounds = 2;
      } else if (threshold >= 70 && threshold <= 85) {
        backendConsensus = 2;
        backendRounds = 3;
      } else {
        backendConsensus = 2;
        backendRounds = 5;
      }

      localStorage.setItem("system_settings_threshold", String(threshold));

      await updateDebugSettings({
        debate_consensus_threshold: backendConsensus,
        max_debate_rounds: backendRounds,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to save settings changes:", err);
      setSaveError(err?.message ?? "An error occurred while saving system changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] px-6 pt-8 pb-28 animate-fade-in select-none">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Platform Config</span>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            System Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure system variables, credentials, and consensus parameters for the underlying Swarm runtime.
          </p>
        </div>

        {saved && (
          <span className="text-xs font-semibold text-mint bg-mint-soft/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 animate-scale-in">
            <Check className="h-4 w-4" /> System changes saved successfully
          </span>
        )}
        {saveError && (
          <span className="text-xs font-semibold text-rose-500 bg-rose-500/10 px-3.5 py-2 rounded-xl flex items-center gap-1.5 animate-scale-in">
            {saveError}
          </span>
        )}
      </header>

      <div className="space-y-6">
        {/* Profile Details */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <User className="h-4.5 w-4.5 text-muted-foreground" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">User profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-border rounded-xl bg-secondary/25 text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-border rounded-xl bg-secondary/25 text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Swarm Consensus Rules */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Shield className="h-4.5 w-4.5 text-muted-foreground" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Swarm Consensus parameters</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-foreground/80">
                <span>Minimum Consensus Threshold</span>
                <span className="font-mono text-indigo-500">{threshold}% confidence</span>
              </div>
              <input
                type="range"
                min="50"
                max="98"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                <span>Relaxed (50%)</span>
                <span>Balanced (75%)</span>
                <span>Strict Consensus (98%)</span>
              </div>
            </div>
            <p className="text-[10.5px] text-muted-foreground leading-normal">
              Note: Higher thresholds trigger more background agent debate passes, increasing latency but ensuring maximum safety and formatting accuracy.
            </p>
          </div>
        </div>

        {/* Vector API Credentials */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Key className="h-4.5 w-4.5 text-muted-foreground" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Vector database credentials</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Qdrant Host URI</label>
              <input
                type="text"
                value="http://localhost:6333"
                disabled
                className="w-full px-3.5 py-2 text-xs border border-border rounded-xl bg-secondary/40 text-muted-foreground select-all font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Vector Dimension Mapping</label>
              <input
                type="text"
                value="1536 dimensions (OpenAI text-embedding-3-small)"
                disabled
                className="w-full px-3.5 py-2 text-xs border border-border rounded-xl bg-secondary/40 text-muted-foreground select-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={triggerSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save system changes
          </button>
        </div>
      </div>
    </div>
  );
}
