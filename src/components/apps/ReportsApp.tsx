import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, ClipboardList, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Report = Tables<'reports'>;

const REPORT_TYPES = ['incident', 'arrest', 'traffic', 'investigation', 'supplemental'];
const STATUSES = ['draft', 'submitted', 'approved', 'rejected'];

const ReportsApp: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Report | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', report_type: 'incident', narrative: '', location: '', incident_date: '' });
  const [loading, setLoading] = useState(false);

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
    // Generate report number
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

  const statusColor = (s: string) => {
    switch (s) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'submitted': return 'bg-primary/20 text-primary';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (selected) {
    return (
      <div className="p-4 h-full overflow-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Back to list
        </button>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-mono font-semibold text-foreground flex-1">{selected.title}</h2>
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${statusColor(selected.status)}`}>{selected.status.toUpperCase()}</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground">{selected.report_number} • {selected.report_type.toUpperCase()}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs font-mono">Location:</span><p>{selected.location || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Incident Date:</span><p>{selected.incident_date ? new Date(selected.incident_date).toLocaleString() : '—'}</p></div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-mono">Narrative:</span>
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
          <ArrowLeft className="w-3 h-3" /> Cancel
        </button>
        <h2 className="text-sm font-mono font-semibold mb-4">NEW REPORT</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Report Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary/50 text-sm" />
          <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm">
            {REPORT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <Input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-secondary/50 text-sm" />
          <Input type="datetime-local" value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))} className="bg-secondary/50 text-sm" />
          <textarea placeholder="Narrative" value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={5} />
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>FILE REPORT</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary/50 text-sm h-8 flex-1" />
        <Button size="sm" onClick={() => setCreating(true)} className="font-mono text-xs gap-1">
          <Plus className="w-3 h-3" /> New
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
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${statusColor(r.status)}`}>{r.status}</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{r.report_number} • {r.report_type}</p>
              </div>
            </button>
          ))}
          {reports.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 font-mono">No reports found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ReportsApp;
