import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type CriminalRecord = Tables<'criminal_records'>;
type Subject = Tables<'subjects'>;

const RecordsApp: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<(CriminalRecord & { subject_name?: string })[]>([]);
  const [creating, setCreating] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectResults, setSubjectResults] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState({ crime_type: '', description: '', evidence: '' });
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    const { data } = await supabase
      .from('criminal_records')
      .select('*, subjects(full_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    setRecords((data || []).map((r: any) => ({ ...r, subject_name: r.subjects?.full_name })));
  };

  useEffect(() => { fetchRecords(); }, []);

  useEffect(() => {
    if (subjectSearch.length < 2) { setSubjectResults([]); return; }
    supabase.from('subjects').select('*').ilike('full_name', `%${subjectSearch}%`).limit(5)
      .then(({ data }) => setSubjectResults(data || []));
  }, [subjectSearch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !form.crime_type.trim()) return;
    setLoading(true);
    await supabase.from('criminal_records').insert({
      subject_id: selectedSubject.id,
      officer_id: user!.id,
      crime_type: form.crime_type,
      description: form.description || null,
      evidence: form.evidence || null,
    });
    setForm({ crime_type: '', description: '', evidence: '' });
    setSelectedSubject(null);
    setSubjectSearch('');
    setCreating(false);
    setLoading(false);
    fetchRecords();
  };

  if (creating) {
    return (
      <div className="p-4 h-full">
        <button onClick={() => setCreating(false)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Cancelar
        </button>
        <h2 className="text-sm font-mono font-semibold mb-4">NUEVO ARCHIVO CRIMINAL</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs font-mono text-muted-foreground">PERSONA</label>
            {selectedSubject ? (
              <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded text-sm">
                <span>{selectedSubject.full_name}</span>
                <button type="button" onClick={() => { setSelectedSubject(null); setSubjectSearch(''); }} className="text-xs text-destructive">×</button>
              </div>
            ) : (
              <div className="relative">
                <Input placeholder="Buscar persona..." value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)} className="bg-secondary/50 text-sm" />
                {subjectResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded shadow-lg">
                    {subjectResults.map(s => (
                      <button key={s.id} type="button" onClick={() => { setSelectedSubject(s); setSubjectResults([]); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60">{s.full_name}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Input placeholder="Tipo de delito *" value={form.crime_type} onChange={e => setForm(f => ({ ...f, crime_type: e.target.value }))} className="bg-secondary/50 text-sm" />
          <textarea placeholder="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={3} />
          <textarea placeholder="Evidencia" value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={2} />
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading || !selectedSubject}>CREAR ARCHIVO</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-mono font-semibold flex-1">Archivos Criminales</span>
        <Button size="sm" onClick={() => setCreating(true)} className="font-mono text-xs gap-1">
          <Plus className="w-3 h-3" /> Nuevo
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {records.map(r => (
            <div key={r.id} className="p-3 rounded bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{r.crime_type}</p>
                <span className="text-xs text-muted-foreground font-mono">{new Date(r.date).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-primary mt-1">Persona: {r.subject_name || 'Desconocido'}</p>
              {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 font-mono">No se encontraron archivos</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RecordsApp;
