import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, CheckCircle } from 'lucide-react';

const SettingsApp: React.FC = () => {
  const { updatePassword, profile } = useAuth();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (pw.length < 6) { setError('Minimum 6 characters'); return; }
    if (pw !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error: err } = await updatePassword(pw);
    if (err) setError(err.message);
    else { setSuccess(true); setPw(''); setConfirm(''); }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-sm font-mono font-semibold mb-1">OFFICER INFO</h2>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Name: {profile?.full_name}</p>
          <p>Badge: #{profile?.badge_number}</p>
          <p>Rank: {profile?.rank}</p>
          <p>Status: {profile?.status}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-mono font-semibold mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4" /> CHANGE PASSWORD
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
          <Input type="password" placeholder="New password" value={pw} onChange={e => setPw(e.target.value)} className="bg-secondary/50 text-sm" />
          <Input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} className="bg-secondary/50 text-sm" />
          {error && <p className="text-xs text-destructive font-mono">{error}</p>}
          {success && <p className="text-xs text-mdc-success font-mono flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Password updated</p>}
          <Button type="submit" className="font-mono text-xs" disabled={loading}>UPDATE PASSWORD</Button>
        </form>
      </div>
    </div>
  );
};

export default SettingsApp;
