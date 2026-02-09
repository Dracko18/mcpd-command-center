import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Subject = Tables<'subjects'>;

const SubjectsApp: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Subject | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ full_name: '', date_of_birth: '', gender: '', nationality: '', address: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const fetchSubjects = async () => {
    const q = supabase.from('subjects').select('*').order('created_at', { ascending: false });
    if (search) {
      const { data } = await q.ilike('full_name', `%${search}%`);
      setSubjects(data || []);
    } else {
      const { data } = await q.limit(50);
      setSubjects(data || []);
    }
  };

  useEffect(() => { fetchSubjects(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setLoading(true);
    await supabase.from('subjects').insert({
      ...form,
      date_of_birth: form.date_of_birth || null,
      created_by: user?.id,
    });
    setForm({ full_name: '', date_of_birth: '', gender: '', nationality: '', address: '', phone: '', notes: '' });
    setCreating(false);
    setLoading(false);
    fetchSubjects();
  };

  if (selected) {
    return (
      <div className="p-4 h-full">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Back to list
        </button>
        <div className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-foreground">{selected.full_name}</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs font-mono">DOB:</span><p>{selected.date_of_birth || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Gender:</span><p>{selected.gender || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Nationality:</span><p>{selected.nationality || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Phone:</span><p>{selected.phone || '—'}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground text-xs font-mono">Address:</span><p>{selected.address || '—'}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground text-xs font-mono">Notes:</span><p className="whitespace-pre-wrap">{selected.notes || '—'}</p></div>
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
        <h2 className="text-sm font-mono font-semibold mb-4">NEW SUBJECT</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Full Name *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-secondary/50 text-sm" />
          <Input type="date" placeholder="Date of Birth" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} className="bg-secondary/50 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Gender" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="bg-secondary/50 text-sm" />
            <Input placeholder="Nationality" value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} className="bg-secondary/50 text-sm" />
          </div>
          <Input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="bg-secondary/50 text-sm" />
          <Input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="bg-secondary/50 text-sm" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={3} />
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>CREATE SUBJECT</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary/50 text-sm h-8 flex-1" />
        <Button size="sm" onClick={() => setCreating(true)} className="font-mono text-xs gap-1">
          <Plus className="w-3 h-3" /> New
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="w-full flex items-center gap-3 p-2 rounded hover:bg-secondary/60 transition-colors text-left"
            >
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">{s.date_of_birth || 'No DOB'} • {s.nationality || 'Unknown'}</p>
              </div>
            </button>
          ))}
          {subjects.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 font-mono">No subjects found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SubjectsApp;
