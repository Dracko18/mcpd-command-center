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
    if (pw.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (pw !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    const { error: err } = await updatePassword(pw);
    if (err) setError(err.message);
    else { setSuccess(true); setPw(''); setConfirm(''); }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-sm font-mono font-semibold mb-1">INFORMACIÓN DEL OFICIAL</h2>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Nombre: {profile?.full_name}</p>
          <p>Placa: #{profile?.badge_number}</p>
          <p>Rango: {profile?.rank}</p>
          <p>Estado: {profile?.status === 'active' ? 'Activo' : profile?.status}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-mono font-semibold mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4" /> CAMBIAR CONTRASEÑA
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
          <Input type="password" placeholder="Nueva contraseña" value={pw} onChange={e => setPw(e.target.value)} className="bg-secondary/50 text-sm" />
          <Input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} className="bg-secondary/50 text-sm" />
          {error && <p className="text-xs text-destructive font-mono">{error}</p>}
          {success && <p className="text-xs text-mdc-success font-mono flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Contraseña actualizada</p>}
          <Button type="submit" className="font-mono text-xs" disabled={loading}>ACTUALIZAR CONTRASEÑA</Button>
        </form>
      </div>
    </div>
  );
};

export default SettingsApp;
