import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../../src/lib/supabase";

interface AuthContextType {
  user: any;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginMock: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Establish initial session (also handles OAuth code exchange via detectSessionInUrl)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.provider_token) {
        sessionStorage.setItem("google_provider_token", session.provider_token);
      }

      if (!session) {
        // Fall back to demo session stored by loginMock()
        try {
          const mockUserJson = localStorage.getItem("mock_user");
          if (mockUserJson) {
            const mockUser = JSON.parse(mockUserJson);
            setUser(mockUser);
            setSession({ user: mockUser });
          }
        } catch {}
      }

      setIsLoading(false);
    });

    // React to sign-in / sign-out events (fires after OAuth callback too)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        // Real session established — clear any leftover demo session
        localStorage.removeItem("mock_user");
        if (session.provider_token) {
          sessionStorage.setItem("google_provider_token", session.provider_token);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Supabase redirects here after Google authenticates the user.
        // This URL must be listed in Supabase → Authentication → URL Configuration → Redirect URLs.
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      // Throw so callers (AuthModal, landing page) can surface the error to the user.
      throw error;
    }

    // signInWithOAuth initiates a browser redirect to Google.
    // Execution past this point only happens if the redirect is blocked.
  };

  const loginMock = () => {
    const mockUser = {
      id: "mock-uuid-1234-5678",
      email: "alex.dev@example.com",
      user_metadata: {
        full_name: "Alex Developer",
        avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Alex",
      },
    };
    localStorage.removeItem(`profile_${mockUser.id}`); // Clear onboarding cache to always force onboarding flow
    localStorage.setItem("mock_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setSession({ user: mockUser });
    setShowAuthModal(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("mock_user");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("calibrationLoaded");
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        showAuthModal,
        setShowAuthModal,
        loginWithGoogle,
        loginMock,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
