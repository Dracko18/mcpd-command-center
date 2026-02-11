import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, ClipboardList, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Report = Tables<'reports'>;

const HIGH_RANKS = ['Comisionado [CMD]', 'Sub-Director [SUB-DIR]', 'Director General [DIR]'];

const REPORT_TYPES = [
  { value: 'incident', label: 'Incidente' },
  { value: 'arrest', label: 'Arresto' },
  { value: 'traffic', label: 'Tráfico' },
  { value: 'investigation', label: 'Investigación' },
  { value: 'supplemental', label: 'Suplementario' },
];
const STATUSES: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const ReportsApp: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Report | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', report_type: 'incident', narrative: '', location: '', incident_date: '' });
  const [loading, setLoading] = useState(false);

  const canModify = isAdmin || HIGH_RANKS.includes(profile?.rank || '');

  const fetchReports = async () => {
    const q = supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (search) {
      const { data } = await q.or(`title.ilike.%${search}%,report_number.ilike.%${search}%,location.ilike.%${search}%`);
      setReports(data || []);
    } else {
      const { data } = await q.limit(50);
      setReports(data || []);
    }
  };

  useEffect(() => { fetchReports(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    const { data: numData } = await supabase.rpc('generate_report_number');
    const reportNumber = numData || `RPT-${Date.now()}`;
    await supabase.from('reports').insert({
      report_number: reportNumber,
      title: form.title,
      report_type: form.report_type,
      narrative: form.narrative || null,
      location: form.location || null,
      incident_date: form.incident_date || null,
      officer_id: user!.id,
    });
    setForm({ title: '', report_type: 'incident', narrative: '', location: '', incident_date: '' });
    setCreating(false);
    setLoading(false);
    fetchReports();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !form.title.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('reports').update({
      title: form.title,
      report_type: form.report_type,
      narrative: form.narrative || null,
      location: form.location || null,
      incident_date: form.incident_date || null,
    }).eq('id', selected.id);
    if (error) { toast.error('Error al actualizar: ' + error.message); }
    else { toast.success('Reporte actualizado'); setEditing(false); setSelected(null); }
    setLoading(false);
    fetchReports();
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm('¿Estás seguro de eliminar este reporte? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    const { error } = await supabase.from('reports').delete().eq('id', selected.id);
    if (error) { toast.error('Error al eliminar: ' + error.message); }
    else { toast.success('Reporte eliminado'); setSelected(null); }
    setLoading(false);
    fetchReports();
  };

  const startEdit = () => {
    if (!selected) return;
    setForm({
      title: selected.title || '',
      report_type: selected.report_type || 'incident',
      narrative: selected.narrative || '',
      location: selected.location || '',
      incident_date: selected.incident_date || '',
    });
    setEditing(true);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'submitted': return 'bg-primary/20 text-primary';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (editing && selected) {
    return (
      <div className="p-4 h-full overflow-auto">
        <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Cancelar
        </button>
        <h2 className="text-sm font-mono font-semibold mb-4">EDITAR REPORTE</h2>
        <form onSubmit={handleEdit} className="space-y-3">
          <Input placeholder="Título del reporte *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary/50 text-sm" />
          <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
            {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Input placeholder="Ubicación" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-secondary/50 text-sm" />
          <Input type="datetime-local" value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))} className="bg-secondary/50 text-sm" />
          <textarea placeholder="Narrativa" value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={5} />
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>GUARDAR CAMBIOS</Button>
        </form>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="p-4 h-full overflow-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Volver a la lista
        </button>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-mono font-semibold text-foreground flex-1">{selected.title}</h2>
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${statusColor(selected.status)}`}>{(STATUSES[selected.status] || selected.status).toUpperCase()}</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground">{selected.report_number} • {(REPORT_TYPES.find(t => t.value === selected.report_type)?.label || selected.report_type).toUpperCase()}</p>
          {canModify && (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={startEdit} className="text-xs gap-1"><Edit className="w-3 h-3" /> Editar</Button>
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading} className="text-xs gap-1"><Trash2 className="w-3 h-3" /> Eliminar</Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs font-mono">Ubicación:</span><p>{selected.location || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Fecha del incidente:</span><p>{selected.incident_date ? new Date(selected.incident_date).toLocaleString() : '—'}</p></div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-mono">Narrativa:</span>
            <p className="text-sm whitespace-pre-wrap mt-1">{selected.narrative || '—'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="p-4 h-full">
        <button onClick={() => setCreating(false)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Cancelar
        </button>
        <h2 className="text-sm font-mono font-semibold mb-4">NUEVO REPORTE</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Título del reporte *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary/50 text-sm" />
          <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
            {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Input placeholder="Ubicación" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-secondary/50 text-sm" />
          <Input type="datetime-local" value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))} className="bg-secondary/50 text-sm" />
          <textarea placeholder="Narrativa" value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={5} />
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>CREAR REPORTE</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar reportes..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary/50 text-sm h-8 flex-1" />
        <Button size="sm" onClick={() => setCreating(true)} className="font-mono text-xs gap-1">
          <Plus className="w-3 h-3" /> Nuevo
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {reports.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full flex items-center gap-3 p-2 rounded hover:bg-secondary/60 transition-colors text-left"
            >
              <ClipboardList className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${statusColor(r.status)}`}>{STATUSES[r.status] || r.status}</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{r.report_number} • {REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type}</p>
              </div>
            </button>
          ))}
          {reports.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 font-mono">No se encontraron reportes</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ReportsApp;
