import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../personalisation/auth/useAuth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/", replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-soft">
          <Sparkles className="h-6 w-6 text-mint animate-pulse" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Workplace Proxy</p>
          <p className="text-xs text-muted-foreground mt-1">Authenticating...</p>
        </div>
      </div>
    </div>
  );
}
