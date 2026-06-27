import { LogOut } from "lucide-react";
import { useAuth } from "../../personalisation/auth/useAuth";

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.email as string | undefined)?.split("@")[0] ??
    "User";
  const email = (user.email as string | undefined) ?? "";
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/60 px-3 py-2.5 bg-sidebar-accent/10">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-sidebar-border"
        />
      ) : (
        <div className="h-7 w-7 rounded-full bg-mint-soft flex items-center justify-center shrink-0 ring-1 ring-sidebar-border">
          <span className="text-[10px] font-bold text-mint">{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-sidebar-foreground truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{email}</p>
      </div>
      <button
        onClick={logout}
        aria-label="Sign out"
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
