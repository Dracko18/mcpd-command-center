import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Car, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Vehicle = Tables<'vehicles'>;

const HIGH_RANKS = ['Comisionado [CMD]', 'Sub-Director [SUB-DIR]', 'Director General [DIR]'];

const VehiclesApp: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ plate_number: '', make: '', model: '', year: '', color: '', vin: '', owner_name: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const canModify = isAdmin || HIGH_RANKS.includes(profile?.rank || '');

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

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !form.plate_number.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('vehicles').update({
      plate_number: form.plate_number,
      make: form.make || null,
      model: form.model || null,
      year: form.year ? parseInt(form.year) : null,
      color: form.color || null,
      vin: form.vin || null,
      owner_name: form.owner_name || null,
      notes: form.notes || null,
      updated_by: user?.id,
    }).eq('id', selected.id);
    if (error) { toast.error('Error al actualizar: ' + error.message); }
    else { toast.success('Vehículo actualizado'); setEditing(false); setSelected(null); }
    setLoading(false);
    fetchVehicles();
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm('¿Estás seguro de eliminar este vehículo? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    const { error } = await supabase.from('vehicles').delete().eq('id', selected.id);
    if (error) { toast.error('Error al eliminar: ' + error.message); }
    else { toast.success('Vehículo eliminado'); setSelected(null); }
    setLoading(false);
    fetchVehicles();
  };

  const startEdit = () => {
    if (!selected) return;
    setForm({
      plate_number: selected.plate_number || '',
      make: selected.make || '',
      model: selected.model || '',
      year: selected.year?.toString() || '',
      color: selected.color || '',
      vin: selected.vin || '',
      owner_name: selected.owner_name || '',
      notes: selected.notes || '',
    });
    setEditing(true);
  };

  if (editing && selected) {
    return (
      <div className="p-4 h-full overflow-auto">
        <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Cancelar
        </button>
        <h2 className="text-sm font-mono font-semibold mb-4">EDITAR VEHÍCULO</h2>
        <form onSubmit={handleEdit} className="space-y-3">
          <Input placeholder="Número de placa *" value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} className="bg-secondary/50 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Marca" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} className="bg-secondary/50 text-sm" />
            <Input placeholder="Modelo" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="bg-secondary/50 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Año" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="bg-secondary/50 text-sm" />
            <Input placeholder="Color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="bg-secondary/50 text-sm" />
          </div>
          <Input placeholder="VIN" value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} className="bg-secondary/50 text-sm" />
          <Input placeholder="Nombre del propietario" value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="bg-secondary/50 text-sm" />
          <textarea placeholder="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={2} />
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>GUARDAR CAMBIOS</Button>
        </form>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="p-4 h-full">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-primary mb-4 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Volver a la lista
        </button>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-mono font-semibold text-foreground">{selected.plate_number}</h2>
            {canModify && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={startEdit} className="text-xs gap-1"><Edit className="w-3 h-3" /> Editar</Button>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading} className="text-xs gap-1"><Trash2 className="w-3 h-3" /> Eliminar</Button>
              </div>
            )}
          </div>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${selected.registration_status === 'active' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
            {selected.registration_status === 'active' ? 'ACTIVO' : selected.registration_status?.toUpperCase()}
          </span>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs font-mono">Marca:</span><p>{selected.make || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Modelo:</span><p>{selected.model || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Año:</span><p>{selected.year || '—'}</p></div>
            <div><span className="text-muted-foreground text-xs font-mono">Color:</span><p>{selected.color || '—'}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground text-xs font-mono">VIN:</span><p className="font-mono text-xs">{selected.vin || '—'}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground text-xs font-mono">Propietario:</span><p>{selected.owner_name || '—'}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground text-xs font-mono">Notas:</span><p className="whitespace-pre-wrap">{selected.notes || '—'}</p></div>
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
        <h2 className="text-sm font-mono font-semibold mb-4">REGISTRAR VEHÍCULO</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Número de placa *" value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} className="bg-secondary/50 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Marca" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} className="bg-secondary/50 text-sm" />
            <Input placeholder="Modelo" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="bg-secondary/50 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Año" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="bg-secondary/50 text-sm" />
            <Input placeholder="Color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="bg-secondary/50 text-sm" />
          </div>
          <Input placeholder="VIN" value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} className="bg-secondary/50 text-sm" />
          <Input placeholder="Nombre del propietario" value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="bg-secondary/50 text-sm" />
          <textarea placeholder="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm" rows={2} />
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>REGISTRAR VEHÍCULO</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar placa, propietario, marca..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary/50 text-sm h-8 flex-1" />
        <Button size="sm" onClick={() => setCreating(true)} className="font-mono text-xs gap-1">
          <Plus className="w-3 h-3" /> Nuevo
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
                <p className="text-xs text-muted-foreground">{[v.color, v.year, v.make, v.model].filter(Boolean).join(' ') || 'Sin detalles'} • {v.owner_name || 'Sin propietario'}</p>
              </div>
            </button>
          ))}
          {vehicles.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 font-mono">No se encontraron vehículos</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VehiclesApp;
