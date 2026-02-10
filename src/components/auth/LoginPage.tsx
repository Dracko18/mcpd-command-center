import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import mcpdLogo from '@/assets/mcpd-logo.png';

const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Usuario y contraseña son requeridos');
      return;
    }
    setLoading(true);
    const email = `${username.trim().toLowerCase()}@mcpd.local`;
    const { error: err } = await signIn(email, password);
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center mdc-scanline">
      <div className="absolute inset-0 bg-gradient-to-br from-mdc-navy via-background to-mdc-charcoal" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-primary/30 mb-4 mdc-glow overflow-hidden">
            <img src={mcpdLogo} alt="MCPD" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-wider text-foreground">MCPD MDC</h1>
          <p className="text-xs font-mono text-muted-foreground mt-1 tracking-widest">
            META CITY POLICE DEPARTMENT
          </p>
          <p className="text-xs font-mono text-muted-foreground tracking-widest">
            MOBILE DATA COMPUTER
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Usuario</label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              className="font-mono bg-secondary/50 border-border"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="font-mono bg-secondary/50 border-border"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-mono">{error}</p>
          )}

          <Button type="submit" className="w-full font-mono tracking-wider" disabled={loading}>
            {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground font-mono">
            SOLO PERSONAL AUTORIZADO • ACCESO NO AUTORIZADO PROHIBIDO
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
