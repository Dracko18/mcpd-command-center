import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const SetPasswordPage: React.FC = () => {
  const { updatePassword } = useAuth();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pw.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (pw !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error: err } = await updatePassword(pw);
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center mdc-scanline">
      <div className="absolute inset-0 bg-gradient-to-br from-mdc-navy via-background to-mdc-charcoal" />
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-primary/30 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-mono font-bold text-foreground">SET NEW PASSWORD</h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">First-time login — create your password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">New Password</label>
            <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" className="font-mono bg-secondary/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Confirm Password</label>
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className="font-mono bg-secondary/50" />
          </div>
          {error && <p className="text-xs text-destructive font-mono">{error}</p>}
          <Button type="submit" className="w-full font-mono tracking-wider" disabled={loading}>
            {loading ? 'UPDATING...' : 'SET PASSWORD'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordPage;
