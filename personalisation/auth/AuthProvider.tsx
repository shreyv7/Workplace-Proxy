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
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fallback to mock session if stored in localStorage
      if (!session) {
        const mockUserJson = localStorage.getItem("mock_user");
        if (mockUserJson) {
          const mockUser = JSON.parse(mockUserJson);
          setUser(mockUser);
          setSession({ user: mockUser });
        }
      }
      setIsLoading(false);
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        localStorage.removeItem("mock_user");
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Supabase OAuth error, falling back to mock login:", err);
      loginMock();
    } finally {
      setIsLoading(false);
    }
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
    localStorage.setItem("mock_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setSession({ user: mockUser });
    setShowAuthModal(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem("mock_user");
    setUser(null);
    setSession(null);
    setIsLoading(false);
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
