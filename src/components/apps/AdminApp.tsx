import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Users, Building } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Division = Tables<'divisions'>;

const AdminApp: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'divisions'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ full_name: '', badge_number: '', rank: 'Officer', division_id: '' });
  const [divForm, setDivForm] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!form.full_name.trim() || !form.badge_number.trim()) return;
    setLoading(true);

    // Create auth user with badge@mcpd.local email and temp password
    const email = `${form.badge_number.trim().toLowerCase()}@mcpd.local`;
    const tempPassword = `MCPD_${form.badge_number}_${Date.now()}`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: { data: { badge_number: form.badge_number } },
    });

    if (authError || !authData.user) {
      console.error('Failed to create user:', authError);
      setLoading(false);
      return;
    }

    // Create profile
    await supabase.from('profiles').insert({
      user_id: authData.user.id,
      full_name: form.full_name,
      badge_number: form.badge_number,
      rank: form.rank,
      division_id: form.division_id || null,
      must_change_password: true,
    });

    // Assign default officer role
    await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'officer' as const,
    });

    setForm({ full_name: '', badge_number: '', rank: 'Officer', division_id: '' });
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

      {tab === 'users' && (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">{profiles.length} officers</span>
            <Button size="sm" onClick={() => setCreating(!creating)} className="font-mono text-xs gap-1">
              <UserPlus className="w-3 h-3" /> Create Officer
            </Button>
          </div>

          {creating && (
            <form onSubmit={handleCreateUser} className="p-3 border-b border-border space-y-2 bg-secondary/20">
              <Input placeholder="Full Name *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-secondary/50 text-sm" />
              <Input placeholder="Badge Number *" value={form.badge_number} onChange={e => setForm(f => ({ ...f, badge_number: e.target.value }))} className="bg-secondary/50 text-sm" />
              <Input placeholder="Rank" value={form.rank} onChange={e => setForm(f => ({ ...f, rank: e.target.value }))} className="bg-secondary/50 text-sm" />
              <select value={form.division_id} onChange={e => setForm(f => ({ ...f, division_id: e.target.value }))} className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
                <option value="">No Division</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>CREATE</Button>
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
