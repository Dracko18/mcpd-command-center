import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import SetPasswordPage from '@/components/auth/SetPasswordPage';
import Desktop from '@/components/desktop/Desktop';

const Index: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-mono text-primary animate-pulse">INITIALIZING MCPD MDC...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (profile?.must_change_password) return <SetPasswordPage />;
  return <Desktop />;
};

export default Index;
