import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Car, FileText, ClipboardList, ShieldAlert, TrendingUp } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

const DashboardApp: React.FC = () => {
  const [stats, setStats] = useState({ subjects: 0, vehicles: 0, records: 0, reports: 0, complaints: 0 });
  const [reportsByType, setReportsByType] = useState<{ name: string; valor: number }[]>([]);
  const [reportsByStatus, setReportsByStatus] = useState<{ name: string; valor: number }[]>([]);
  const [crimeTypes, setCrimeTypes] = useState<{ name: string; valor: number }[]>([]);
  const [complaintsByStatus, setComplaintsByStatus] = useState<{ name: string; valor: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const TYPE_LABELS: Record<string, string> = { incident: 'Incidente', arrest: 'Arresto', traffic: 'Tráfico', investigation: 'Investigación', supplemental: 'Suplementario' };
  const STATUS_LABELS: Record<string, string> = { draft: 'Borrador', submitted: 'Enviado', approved: 'Aprobado', rejected: 'Rechazado', open: 'Abierta', under_investigation: 'En Investigación', closed: 'Cerrada', sustained: 'Sustanciada', not_sustained: 'No Sustanciada', exonerated: 'Exonerada', unfounded: 'Infundada' };

  useEffect(() => {
    const fetchAll = async () => {
      const [subRes, vehRes, recRes, repRes, compRes] = await Promise.all([
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('criminal_records').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id, report_type, status'),
        supabase.from('ia_complaints').select('id, status'),
      ]);

      setStats({
        subjects: subRes.count || 0,
        vehicles: vehRes.count || 0,
        records: recRes.count || 0,
        reports: repRes.data?.length || 0,
        complaints: compRes.data?.length || 0,
      });

      // Reports by type
      const typeMap: Record<string, number> = {};
      (repRes.data || []).forEach(r => { typeMap[r.report_type] = (typeMap[r.report_type] || 0) + 1; });
      setReportsByType(Object.entries(typeMap).map(([k, v]) => ({ name: TYPE_LABELS[k] || k, valor: v })));

      // Reports by status
      const statusMap: Record<string, number> = {};
      (repRes.data || []).forEach(r => { statusMap[r.status] = (statusMap[r.status] || 0) + 1; });
      setReportsByStatus(Object.entries(statusMap).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, valor: v })));

      // Crime types (top 6)
      const { data: crimeData } = await supabase.from('criminal_records').select('crime_type');
      const crimeMap: Record<string, number> = {};
      (crimeData || []).forEach(r => { crimeMap[r.crime_type] = (crimeMap[r.crime_type] || 0) + 1; });
      setCrimeTypes(Object.entries(crimeMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ name: k, valor: v })));

      // Complaints by status
      const compMap: Record<string, number> = {};
      (compRes.data || []).forEach(c => { compMap[c.status] = (compMap[c.status] || 0) + 1; });
      setComplaintsByStatus(Object.entries(compMap).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, valor: v })));

      setLoading(false);
    };
    fetchAll();
  }, []);

  const statCards = [
    { label: 'Personas', value: stats.subjects, icon: Users, color: 'text-primary' },
    { label: 'Vehículos', value: stats.vehicles, icon: Car, color: 'text-primary' },
    { label: 'Archivos Criminales', value: stats.records, icon: FileText, color: 'text-destructive' },
    { label: 'Reportes', value: stats.reports, icon: ClipboardList, color: 'text-primary' },
    { label: 'Quejas AI', value: stats.complaints, icon: ShieldAlert, color: 'text-destructive' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <TrendingUp className="w-8 h-8 text-primary animate-pulse mx-auto mb-2" />
          <p className="text-xs font-mono text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono font-semibold text-primary">PANEL DE ESTADÍSTICAS</span>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-5 gap-2">
          {statCards.map(s => (
            <div key={s.label} className="bg-secondary/40 rounded-lg p-3 text-center border border-border/50">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-xl font-bold font-mono text-foreground">{s.value}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
            <p className="text-xs font-mono font-semibold text-muted-foreground mb-2">REPORTES POR TIPO</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={reportsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
            <p className="text-xs font-mono font-semibold text-muted-foreground mb-2">REPORTES POR ESTADO</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={reportsByStatus} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, valor }) => `${name}: ${valor}`} labelLine={false} style={{ fontSize: 10 }}>
                  {reportsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
            <p className="text-xs font-mono font-semibold text-muted-foreground mb-2">TIPOS DE DELITO (TOP 6)</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={crimeTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={100} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="valor" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
            <p className="text-xs font-mono font-semibold text-muted-foreground mb-2">QUEJAS ASUNTOS INTERNOS</p>
            {complaintsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={complaintsByStatus} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, valor }) => `${name}: ${valor}`} labelLine={false} style={{ fontSize: 10 }}>
                    {complaintsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px]">
                <p className="text-xs text-muted-foreground font-mono">Sin datos de quejas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default DashboardApp;
