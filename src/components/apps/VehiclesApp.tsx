import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Car, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Vehicle = Tables<'vehicles'>;

const VehiclesApp: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ plate_number: '', make: '', model: '', year: '', color: '', vin: '', owner_name: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const fetchVehicles = async () => {
    const q = supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (search) {
      const { data } = await q.or(`plate_number.ilike.%${search}%,owner_name.ilike.%${search}%,make.ilike.%${search}%`);
      setVehicles(data || []);
    } else {
      const { data } = await q.limit(50);
      setVehicles(data || []);
    }
  };

  useEffect(() => { fetchVehicles(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plate_number.trim()) return;
    setLoading(true);
    await supabase.from('vehicles').insert({
      plate_number: form.plate_number,
      make: form.make || null,
      model: form.model || null,
      year: form.year ? parseInt(form.year) : null,
      color: form.color || null,
      vin: form.vin || null,
      owner_name: form.owner_name || null,
      notes: form.notes || null,
      created_by: user?.id,
    });
    setForm({ plate_number: '', make: '', model: '', year: '', color: '', vin: '', owner_name: '', notes: '' });
    setCreating(false);
    setLoading(false);
    fetchVehicles();
  };

  if (selected) {
    return (
      <div className="p-4 h-full">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Back to list
        </button>
        <div className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-foreground">{selected.plate_number}</h2>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${selected.registration_status === 'active' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
            {selected.registration_status?.toUpperCase()}
          </span>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs font-mono">Make:</span><p>{selected.make || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Model:</span><p>{selected.model || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Year:</span><p>{selected.year || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Color:</span><p>{selected.color || '—'}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground text-xs font-mono">VIN:</span><p className="font-mono text-xs">{selected.vin || '—'}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground text-xs font-mono">Owner:</span><p>{selected.owner_name || '—'}</p></div>
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
        <h2 className="text-sm font-mono font-semibold mb-4">REGISTER VEHICLE</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Plate Number *" value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} className="bg-secondary/50 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Make" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} className="bg-secondary/50 text-sm" />
            <Input placeholder="Model" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="bg-secondary/50 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="bg-secondary/50 text-sm" />
            <Input placeholder="Color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="bg-secondary/50 text-sm" />
          </div>
          <Input placeholder="VIN" value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} className="bg-secondary/50 text-sm" />
          <Input placeholder="Owner Name" value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="bg-secondary/50 text-sm" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={2} />
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>REGISTER VEHICLE</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search plate, owner, make..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary/50 text-sm h-8 flex-1" />
        <Button size="sm" onClick={() => setCreating(true)} className="font-mono text-xs gap-1">
          <Plus className="w-3 h-3" /> New
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {vehicles.map(v => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              className="w-full flex items-center gap-3 p-2 rounded hover:bg-secondary/60 transition-colors text-left"
            >
              <Car className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium font-mono">{v.plate_number}</p>
                <p className="text-xs text-muted-foreground">{[v.color, v.year, v.make, v.model].filter(Boolean).join(' ') || 'No details'} • {v.owner_name || 'No owner'}</p>
              </div>
            </button>
          ))}
          {vehicles.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 font-mono">No vehicles found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VehiclesApp;
