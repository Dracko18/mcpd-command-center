import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Users, Building } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Division = Tables<'divisions'>;

const RANKS = [
  { value: 'Enforcer I [ENF-I]', label: '01 - Enforcer I [ENF-I]' },
  { value: 'Enforcer II [ENF-II]', label: '02 - Enforcer II [ENF-II]' },
  { value: 'Enforcer III [ENF-III]', label: '03 - Enforcer III [ENF-III]' },
  { value: 'Elite Enforcer [E-ENF]', label: '04 - Elite Enforcer [E-ENF]' },
  { value: 'Sentinel I [SEN-I]', label: '05 - Sentinel I [SEN-I]' },
  { value: 'Sentinel II [SEN-II]', label: '06 - Sentinel II [SEN-II]' },
  { value: 'Warden [WRN]', label: '07 - Warden [WRN]' },
  { value: 'Overseer [OVR]', label: '08 - Overseer [OVR]' },
  { value: 'Comandante [CMDT]', label: '09 - Comandante [CMDT]' },
  { value: 'Comisionado [CMD]', label: '10 - Comisionado [CMD]' },
  { value: 'Sub-Director [SUB-DIR]', label: '11 - Sub-Director [SUB-DIR]' },
  { value: 'Director General [DIR]', label: '12 - Director General [DIR]' },
];

const AdminApp: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'divisions'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ full_name: '', badge_number: '', username: '', rank: 'Enforcer I [ENF-I]', division_id: '' });
  const [divForm, setDivForm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    const [pRes, dRes] = await Promise.all([
      supabase.from('profiles').select('*').order('badge_number'),
      supabase.from('divisions').select('*').order('name'),
    ]);
    setProfiles(pRes.data || []);
    setDivisions(dRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.badge_number.trim() || !form.username.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const { data, error: fnError } = await supabase.functions.invoke('create-user', {
      body: {
        full_name: form.full_name,
        badge_number: form.badge_number,
        username: form.username,
        rank: form.rank,
        division_id: form.division_id || null,
      },
    });

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || 'Failed to create user');
      setLoading(false);
      return;
    }

    setSuccess(`User "${form.username}" created. Default password: 1234`);
    setForm({ full_name: '', badge_number: '', username: '', rank: 'Enforcer I [ENF-I]', division_id: '' });
    setCreating(false);
    setLoading(false);
    fetchData();
  };

  const handleCreateDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divForm.trim()) return;
    await supabase.from('divisions').insert({ name: divForm.trim() });
    setDivForm('');
    fetchData();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button onClick={() => setTab('users')} className={`flex items-center gap-2 px-4 py-2 text-xs font-mono ${tab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <Users className="w-3 h-3" /> Officers
        </button>
        <button onClick={() => setTab('divisions')} className={`flex items-center gap-2 px-4 py-2 text-xs font-mono ${tab === 'divisions' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <Building className="w-3 h-3" /> Divisions
        </button>
      </div>

      {success && (
        <div className="mx-3 mt-2 p-2 rounded bg-green-500/10 border border-green-500/30 text-xs font-mono text-green-400">
          {success}
        </div>
      )}

      {tab === 'users' && (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">{profiles.length} officers</span>
            <Button size="sm" onClick={() => { setCreating(!creating); setError(''); setSuccess(''); }} className="font-mono text-xs gap-1">
              <UserPlus className="w-3 h-3" /> Create Officer
            </Button>
          </div>

          {creating && (
            <form onSubmit={handleCreateUser} className="p-3 border-b border-border space-y-2 bg-secondary/20">
              <Input placeholder="Full Name *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-secondary/50 text-sm" />
              <Input placeholder="Username *" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="bg-secondary/50 text-sm" />
              <Input placeholder="Badge Number *" value={form.badge_number} onChange={e => setForm(f => ({ ...f, badge_number: e.target.value }))} className="bg-secondary/50 text-sm" />
              <select value={form.rank} onChange={e => setForm(f => ({ ...f, rank: e.target.value }))}
                className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
                {RANKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <select value={form.division_id} onChange={e => setForm(f => ({ ...f, division_id: e.target.value }))}
                className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
                <option value="">No Division</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {error && <p className="text-xs text-destructive font-mono">{error}</p>}
              <p className="text-[10px] text-muted-foreground font-mono">Default password: 1234</p>
              <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>
                {loading ? 'CREATING...' : 'CREATE OFFICER'}
              </Button>
            </form>
          )}

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded hover:bg-secondary/40">
                  <div>
                    <p className="text-sm font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">#{p.badge_number} • {p.rank} • {p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {tab === 'divisions' && (
        <div className="flex-1 flex flex-col">
          <form onSubmit={handleCreateDivision} className="p-3 border-b border-border flex gap-2">
            <Input placeholder="New division name" value={divForm} onChange={e => setDivForm(e.target.value)} className="bg-secondary/50 text-sm flex-1" />
            <Button type="submit" size="sm" className="font-mono text-xs">Add</Button>
          </form>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {divisions.map(d => (
                <div key={d.id} className="p-2 rounded bg-secondary/20">
                  <p className="text-sm">{d.name}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AdminApp;
