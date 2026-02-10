import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Users, Building, Pencil, Trash2, KeyRound, Shield, X } from 'lucide-react';
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

const ROLES = [
  { value: 'officer', label: 'Oficial' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'administrator', label: 'Administrador' },
  { value: 'internal_affairs', label: 'Asuntos Internos' },
];

const AdminApp: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'divisions'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: '', badge_number: '', username: '', rank: 'Enforcer I [ENF-I]', division_id: '' });
  const [editForm, setEditForm] = useState({ full_name: '', badge_number: '', rank: '', division_id: '', status: '', role: '' });
  const [divForm, setDivForm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    const [pRes, dRes, rRes] = await Promise.all([
      supabase.from('profiles').select('*').order('badge_number'),
      supabase.from('divisions').select('*').order('name'),
      supabase.from('user_roles').select('*'),
    ]);
    setProfiles(pRes.data || []);
    setDivisions(dRes.data || []);
    const rolesMap: Record<string, string> = {};
    (rRes.data || []).forEach((r: any) => { rolesMap[r.user_id] = r.role; });
    setUserRoles(rolesMap);
  };

  useEffect(() => { fetchData(); }, []);

  const invokeManage = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });
    return resp.json();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.badge_number.trim() || !form.username.trim()) return;
    setLoading(true); setError(''); setSuccess('');

    const { data, error: fnError } = await supabase.functions.invoke('create-user', {
      body: { full_name: form.full_name, badge_number: form.badge_number, username: form.username, rank: form.rank, division_id: form.division_id || null },
    });

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || 'Error al crear usuario');
    } else {
      setSuccess(`Usuario "${form.username}" creado. Contraseña: 1234`);
      setForm({ full_name: '', badge_number: '', username: '', rank: 'Enforcer I [ENF-I]', division_id: '' });
      setCreating(false);
    }
    setLoading(false);
    fetchData();
  };

  const startEdit = (p: Profile) => {
    setEditingId(p.user_id);
    setEditForm({
      full_name: p.full_name,
      badge_number: p.badge_number,
      rank: p.rank,
      division_id: p.division_id || '',
      status: p.status,
      role: userRoles[p.user_id] || 'officer',
    });
    setError(''); setSuccess('');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setLoading(true); setError(''); setSuccess('');

    const [profRes, roleRes] = await Promise.all([
      invokeManage({
        action: 'update_profile', user_id: editingId,
        full_name: editForm.full_name, badge_number: editForm.badge_number,
        rank: editForm.rank, division_id: editForm.division_id, status: editForm.status,
      }),
      invokeManage({ action: 'update_role', user_id: editingId, role: editForm.role }),
    ]);

    if (profRes.error || roleRes.error) {
      setError(profRes.error || roleRes.error);
    } else {
      setSuccess('Oficial actualizado correctamente');
      setEditingId(null);
    }
    setLoading(false);
    fetchData();
  };

  const handleDelete = async (p: Profile) => {
    if (!confirm(`¿Eliminar al oficial "${p.full_name}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true); setError(''); setSuccess('');
    const res = await invokeManage({ action: 'delete', user_id: p.user_id });
    if (res.error) setError(res.error);
    else setSuccess(`Oficial "${p.full_name}" eliminado`);
    setLoading(false);
    fetchData();
  };

  const handleResetPassword = async (p: Profile) => {
    if (!confirm(`¿Resetear la contraseña de "${p.full_name}" a 1234?`)) return;
    setLoading(true); setError(''); setSuccess('');
    const res = await invokeManage({ action: 'reset_password', user_id: p.user_id });
    if (res.error) setError(res.error);
    else setSuccess(`Contraseña de "${p.full_name}" reseteada a 1234`);
    setLoading(false);
  };

  const handleCreateDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divForm.trim()) return;
    await supabase.from('divisions').insert({ name: divForm.trim() });
    setDivForm('');
    fetchData();
  };

  const selectClass = "w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm";

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border">
        <button onClick={() => setTab('users')} className={`flex items-center gap-2 px-4 py-2 text-xs font-mono ${tab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <Users className="w-3 h-3" /> Oficiales
        </button>
        <button onClick={() => setTab('divisions')} className={`flex items-center gap-2 px-4 py-2 text-xs font-mono ${tab === 'divisions' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <Building className="w-3 h-3" /> Divisiones
        </button>
      </div>

      {success && <div className="mx-3 mt-2 p-2 rounded bg-green-500/10 border border-green-500/30 text-xs font-mono text-green-400">{success}</div>}
      {error && <div className="mx-3 mt-2 p-2 rounded bg-destructive/10 border border-destructive/30 text-xs font-mono text-destructive">{error}</div>}

      {tab === 'users' && (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">{profiles.length} oficiales</span>
            <Button size="sm" onClick={() => { setCreating(!creating); setEditingId(null); setError(''); setSuccess(''); }} className="font-mono text-xs gap-1">
              <UserPlus className="w-3 h-3" /> Crear Oficial
            </Button>
          </div>

          {creating && (
            <form onSubmit={handleCreateUser} className="p-3 border-b border-border space-y-2 bg-secondary/20">
              <Input placeholder="Nombre completo *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-secondary/50 text-sm" />
              <Input placeholder="Usuario *" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="bg-secondary/50 text-sm" />
              <Input placeholder="Número de placa *" value={form.badge_number} onChange={e => setForm(f => ({ ...f, badge_number: e.target.value }))} className="bg-secondary/50 text-sm" />
              <select value={form.rank} onChange={e => setForm(f => ({ ...f, rank: e.target.value }))} className={selectClass}>
                {RANKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <select value={form.division_id} onChange={e => setForm(f => ({ ...f, division_id: e.target.value }))} className={selectClass}>
                <option value="">Sin División</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <p className="text-[10px] text-muted-foreground font-mono">Contraseña por defecto: 1234</p>
              <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>
                {loading ? 'CREANDO...' : 'CREAR OFICIAL'}
              </Button>
            </form>
          )}

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {profiles.map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-secondary/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        #{p.badge_number} • {p.rank} • {p.status === 'active' ? 'Activo' : p.status}
                        {userRoles[p.user_id] && <span className="ml-1 text-primary">• {ROLES.find(r => r.value === userRoles[p.user_id])?.label || userRoles[p.user_id]}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button onClick={() => handleResetPassword(p)} title="Resetear contraseña" className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => editingId === p.user_id ? setEditingId(null) : startEdit(p)} title="Editar" className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
                        {editingId === p.user_id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleDelete(p)} title="Eliminar" className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {editingId === p.user_id && (
                    <div className="mx-2 mb-2 p-3 rounded border border-border bg-secondary/20 space-y-2">
                      <Input placeholder="Nombre completo" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} className="bg-secondary/50 text-sm" />
                      <Input placeholder="Número de placa" value={editForm.badge_number} onChange={e => setEditForm(f => ({ ...f, badge_number: e.target.value }))} className="bg-secondary/50 text-sm" />
                      <select value={editForm.rank} onChange={e => setEditForm(f => ({ ...f, rank: e.target.value }))} className={selectClass}>
                        {RANKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <select value={editForm.division_id} onChange={e => setEditForm(f => ({ ...f, division_id: e.target.value }))} className={selectClass}>
                        <option value="">Sin División</option>
                        {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className={selectClass}>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="suspended">Suspendido</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className={selectClass}>
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                      <Button onClick={handleSaveEdit} className="w-full font-mono text-xs" disabled={loading}>
                        {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {tab === 'divisions' && (
        <div className="flex-1 flex flex-col">
          <form onSubmit={handleCreateDivision} className="p-3 border-b border-border flex gap-2">
            <Input placeholder="Nombre de nueva división" value={divForm} onChange={e => setDivForm(e.target.value)} className="bg-secondary/50 text-sm flex-1" />
            <Button type="submit" size="sm" className="font-mono text-xs">Agregar</Button>
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
