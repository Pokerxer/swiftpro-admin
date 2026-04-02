'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { statsAPI } from '@/lib/api';
import { Plus, Edit, Trash2, X, BarChart2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

const BRAND = '#0A2463';

interface Stat {
  _id: string;
  label: string;
  value: string;
  suffix: string;
  prefix: string;
  order: number;
}

const empty = { label: '', value: '', suffix: '', prefix: '', order: 0 };

const ACCENT_COLORS = ['#3A86FF', '#10B981', '#F59E0B', '#E63946', '#8B5CF6', '#0A2463'];

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: type === 'success' ? '#10B981' : '#E63946', color: 'white', padding: '0.875rem 1.25rem', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '240px' }}>
      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}><X size={16} /></button>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', height: 110 }}>
          <div style={{ height: 36, width: '60%', background: '#e5e7eb', borderRadius: 6, marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 14, width: '80%', background: '#e5e7eb', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Stat | null>(null);
  const [formData, setFormData] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState<Stat | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { if (!isAuthenticated) router.push('/login'); fetchStats(); }, [isAuthenticated, router]);

  const fetchStats = async () => {
    try {
      const res = await statsAPI.getAll();
      const sorted = [...res.data].sort((a: Stat, b: Stat) => a.order - b.order);
      setStats(sorted);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...empty, order: stats.length });
    setShowModal(true);
  };

  const openEdit = (stat: Stat) => {
    setEditing(stat);
    setFormData({ label: stat.label, value: stat.value, suffix: stat.suffix || '', prefix: stat.prefix || '', order: stat.order });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await statsAPI.update(editing._id, formData);
        setToast({ msg: 'Stat updated', type: 'success' });
      } else {
        await statsAPI.create(formData);
        setToast({ msg: 'Stat created', type: 'success' });
      }
      setShowModal(false);
      setEditing(null);
      fetchStats();
    } catch {
      setToast({ msg: 'Failed to save stat', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await statsAPI.delete(deleteTarget._id);
      setToast({ msg: 'Stat deleted', type: 'success' });
      fetchStats();
    } catch {
      setToast({ msg: 'Failed to delete stat', type: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const moveOrder = async (stat: Stat, dir: 'up' | 'down') => {
    const idx = stats.findIndex(s => s._id === stat._id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= stats.length) return;
    const swap = stats[swapIdx];
    try {
      await Promise.all([
        statsAPI.update(stat._id, { ...stat, order: swap.order }),
        statsAPI.update(swap._id, { ...swap, order: stat.order }),
      ]);
      fetchStats();
    } catch {
      setToast({ msg: 'Failed to reorder', type: 'error' });
    }
  };

  const inputStyle = { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', width: '100%', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: '0.8rem', fontWeight: 600 as const, color: '#374151', display: 'block' as const, marginBottom: '0.35rem' };

  // Preview formatted value
  const previewValue = `${formData.prefix || ''}${formData.value || '0'}${formData.suffix || ''}`;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: BRAND }}>Stats</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>{stats.length} stat{stats.length !== 1 ? 's' : ''} — shown on homepage</p>
        </div>
        <button onClick={openCreate} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          <Plus size={18} /> Add Stat
        </button>
      </div>

      {/* Grid preview */}
      {loading ? <Skeleton /> : (
        <>
          {stats.length === 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
              <BarChart2 size={40} style={{ margin: '0 auto 1rem', display: 'block' }} />
              <p style={{ fontWeight: 500 }}>No stats yet. Add your first stat.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {stats.map((stat, idx) => {
              const color = ACCENT_COLORS[idx % ACCENT_COLORS.length];
              return (
                <div key={stat._id} style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'relative' }}>
                  <div style={{ height: 4, background: color }} />
                  <div style={{ padding: '1.25rem 1.25rem 0.75rem' }}>
                    <p style={{ fontSize: '2.25rem', fontWeight: 800, color, margin: '0 0 0.25rem', lineHeight: 1 }}>
                      {stat.prefix || ''}{stat.value}{stat.suffix || ''}
                    </p>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>{stat.label}</p>
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => moveOrder(stat, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: '4px', color: idx === 0 ? '#D1D5DB' : '#6B7280', borderRadius: 4 }}><ArrowUp size={14} /></button>
                      <button onClick={() => moveOrder(stat, 'down')} disabled={idx === stats.length - 1} style={{ background: 'none', border: 'none', cursor: idx === stats.length - 1 ? 'default' : 'pointer', padding: '4px', color: idx === stats.length - 1 ? '#D1D5DB' : '#6B7280', borderRadius: 4 }}><ArrowDown size={14} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => openEdit(stat)} style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: '6px', color: '#374151', display: 'flex', alignItems: 'center' }}><Edit size={14} /></button>
                      <button onClick={() => setDeleteTarget(stat)} style={{ background: '#FEF2F2', border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: '6px', color: '#E63946', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reorder hint */}
          {stats.length > 1 && (
            <p style={{ fontSize: '0.78rem', color: '#9CA3AF', textAlign: 'center' }}>
              Use the arrow buttons on each card to reorder stats
            </p>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: '480px', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', margin: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: BRAND, margin: 0 }}>{editing ? 'Edit Stat' : 'New Stat'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
            </div>

            {/* Live preview */}
            <div style={{ padding: '1rem 1.5rem', background: '#F9FAFB', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>Preview</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: 'white', borderRadius: '10px', padding: '0.75rem 1.25rem', border: '1px solid #e5e7eb', minWidth: 120 }}>
                  <p style={{ fontSize: '1.75rem', fontWeight: 800, color: BRAND, margin: '0 0 2px', lineHeight: 1 }}>{previewValue}</p>
                  <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: 0 }}>{formData.label || 'Label'}</p>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>Appears on the homepage stats section</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Label *</label>
                  <input value={formData.label} onChange={e => setFormData(f => ({ ...f, label: e.target.value }))} required placeholder="e.g. Projects Completed" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Value *</label>
                  <input value={formData.value} onChange={e => setFormData(f => ({ ...f, value: e.target.value }))} required placeholder="e.g. 200" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Prefix</label>
                    <input value={formData.prefix} onChange={e => setFormData(f => ({ ...f, prefix: e.target.value }))} placeholder="e.g. $" style={inputStyle} />
                    <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.25rem' }}>Appears before the value</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Suffix</label>
                    <input value={formData.suffix} onChange={e => setFormData(f => ({ ...f, suffix: e.target.value }))} placeholder="e.g. +" style={inputStyle} />
                    <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.25rem' }}>Appears after the value</p>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Display Order</label>
                  <input type="number" min={0} value={formData.order} onChange={e => setFormData(f => ({ ...f, order: Number(e.target.value) }))} style={{ ...inputStyle, width: 100 }} />
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: '#FAFAFA' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #ddd', padding: '0.625rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#6B7280' : BRAND, color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '6px', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>{saving ? 'Saving...' : editing ? 'Update Stat' : 'Create Stat'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEF2F2', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={22} color="#E63946" /></div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Delete Stat?</h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>"{deleteTarget.label}" will be permanently removed.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: 'white', border: '1px solid #ddd', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex: 1, background: '#E63946', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
