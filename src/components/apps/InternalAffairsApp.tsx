import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type IAComplaint = Tables<'ia_complaints'>;

const CATEGORIES: Record<string, string> = {
  excessive_force: 'Uso excesivo de fuerza',
  misconduct: 'Mala conducta',
  corruption: 'Corrupción',
  discrimination: 'Discriminación',
  neglect_of_duty: 'Negligencia',
  policy_violation: 'Violación de protocolo',
  other: 'Otro',
};
const IA_STATUSES: Record<string, string> = {
  open: 'Abierto',
  investigating: 'Investigando',
  review: 'En revisión',
  closed: 'Cerrado',
};

const InternalAffairsApp: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<IAComplaint[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<IAComplaint | null>(null);
  const [creating, setCreating] = useState(false);
  const [officers, setOfficers] = useState<{ user_id: string; full_name: string; badge_number: string }[]>([]);
  const [form, setForm] = useState({ subject_officer_id: '', complainant_name: '', complainant_type: 'civilian', category: 'misconduct', description: '' });
  const [loading, setLoading] = useState(false);

  const fetchComplaints = async () => {
    const q = supabase.from('ia_complaints').select('*').order('created_at', { ascending: false });
    if (search) {
      const { data } = await q.or(`complaint_number.ilike.%${search}%,complainant_name.ilike.%${search}%,category.ilike.%${search}%`);
      setComplaints(data || []);
    } else {
      const { data } = await q.limit(50);
      setComplaints(data || []);
    }
  };

  const fetchOfficers = async () => {
    const { data } = await supabase.from('profiles').select('user_id, full_name, badge_number').eq('status', 'active');
    setOfficers(data || []);
  };

  useEffect(() => { fetchComplaints(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject_officer_id || !form.description.trim()) return;
    setLoading(true);
    const { data: numData } = await supabase.rpc('generate_ia_number');
    const complaintNumber = numData || `IA-${Date.now()}`;
    await supabase.from('ia_complaints').insert({
      complaint_number: complaintNumber,
      subject_officer_id: form.subject_officer_id,
      complainant_name: form.complainant_name || null,
      complainant_type: form.complainant_type,
      category: form.category,
      description: form.description,
      filed_by: user!.id,
    });
    setForm({ subject_officer_id: '', complainant_name: '', complainant_type: 'civilian', category: 'misconduct', description: '' });
    setCreating(false);
    setLoading(false);
    fetchComplaints();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-destructive/20 text-destructive';
      case 'investigating': return 'bg-yellow-500/20 text-yellow-400';
      case 'review': return 'bg-primary/20 text-primary';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (selected) {
    const officer = officers.find(o => o.user_id === selected.subject_officer_id);
    return (
      <div className="p-4 h-full overflow-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Volver a la lista
        </button>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-mono font-semibold text-foreground flex-1">{selected.complaint_number}</h2>
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${statusColor(selected.status)}`}>{(IA_STATUSES[selected.status] || selected.status).toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs font-mono">Categoría:</span><p>{CATEGORIES[selected.category] || selected.category}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Oficial investigado:</span><p>{officer?.full_name || selected.subject_officer_id}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Denunciante:</span><p>{selected.complainant_name || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Tipo:</span><p>{selected.complainant_type === 'civilian' ? 'Civil' : selected.complainant_type === 'officer' ? 'Oficial' : 'Anónimo'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Resultado:</span><p>{selected.outcome || 'Pendiente'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Fecha:</span><p>{new Date(selected.created_at).toLocaleDateString()}</p></div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-mono">Descripción:</span>
            <p className="text-sm whitespace-pre-wrap mt-1">{selected.description}</p>
          </div>
        </div>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="p-4 h-full">
        <button onClick={() => { setCreating(false); }} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Cancelar
        </button>
        <h2 className="text-sm font-mono font-semibold mb-4">NUEVA QUEJA IA</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs font-mono text-muted-foreground">OFICIAL INVESTIGADO *</label>
            <select value={form.subject_officer_id} onChange={e => setForm(f => ({ ...f, subject_officer_id: e.target.value }))}
              className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
              <option value="">Seleccionar oficial...</option>
              {officers.map(o => <option key={o.user_id} value={o.user_id}>{o.full_name} (#{o.badge_number})</option>)}
            </select>
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Input placeholder="Nombre del denunciante" value={form.complainant_name} onChange={e => setForm(f => ({ ...f, complainant_name: e.target.value }))} className="bg-secondary/50 text-sm" />
          <select value={form.complainant_type} onChange={e => setForm(f => ({ ...f, complainant_type: e.target.value }))}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
            <option value="civilian">Civil</option>
            <option value="officer">Oficial</option>
            <option value="anonymous">Anónimo</option>
          </select>
          <textarea placeholder="Descripción *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={4} />
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading || !form.subject_officer_id}>PRESENTAR QUEJA</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar quejas..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary/50 text-sm h-8 flex-1" />
        <Button size="sm" onClick={() => { setCreating(true); fetchOfficers(); }} className="font-mono text-xs gap-1">
          <Plus className="w-3 h-3" /> Nueva
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {complaints.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelected(c); fetchOfficers(); }}
              className="w-full flex items-center gap-3 p-2 rounded hover:bg-secondary/60 transition-colors text-left"
            >
              <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium font-mono">{c.complaint_number}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${statusColor(c.status)}`}>{IA_STATUSES[c.status] || c.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{CATEGORIES[c.category] || c.category} • {c.complainant_name || 'Anónimo'}</p>
              </div>
            </button>
          ))}
          {complaints.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 font-mono">No se encontraron quejas</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default InternalAffairsApp;
