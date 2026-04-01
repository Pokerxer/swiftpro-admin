'use client';

import { useEffect, useState } from 'react';
import { testimonialsAPI } from '@/lib/api';
import { Plus, Edit, Trash2, Search, X, Check, AlertCircle, MessageSquare, Star } from 'lucide-react';

interface Testimonial {
  _id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  rating: number;
}

interface FormData {
  name: string; role: string; company: string;
  content: string; avatar: string; rating: number;
}

const BRAND = '#0A2463';
const BRAND_LIGHT = '#e8edf7';
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.7rem 0.875rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', background: '#fff' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.78rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' };

const emptyForm: FormData = { name: '', role: '', company: '', content: '', avatar: '', rating: 5 };

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: '2px', display: 'flex' }}>
          <Star size={onChange ? 22 : 16} color="#F59E0B" fill={(hover || value) >= n ? '#F59E0B' : 'none'} />
        </button>
      ))}
    </div>
  );
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  useEffect(() => { fetchTestimonials(); }, []);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }
  }, [toast]);

  const fetchTestimonials = async () => {
    setLoading(true);
    try { const res = await testimonialsAPI.getAll(); setTestimonials(res.data); }
    catch { showToast('Failed to load testimonials', 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });
  const openCreate = () => { setEditing(null); setFormData(emptyForm); setShowForm(true); };
  const openEdit = (t: Testimonial) => { setEditing(t); setFormData({ name: t.name, role: t.role, company: t.company || '', content: t.content, avatar: t.avatar || '', rating: t.rating || 5 }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await testimonialsAPI.update(editing._id, formData); showToast('Testimonial updated', 'success'); }
      else { await testimonialsAPI.create(formData); showToast('Testimonial added', 'success'); }
      closeForm(); fetchTestimonials();
    } catch { showToast('Failed to save testimonial', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await testimonialsAPI.delete(id); showToast('Testimonial deleted', 'success'); setDeleteConfirm(null); fetchTestimonials(); }
    catch { showToast('Failed to delete', 'error'); }
  };

  const filtered = testimonials.filter(t =>
    (t.name.toLowerCase().includes(search.toLowerCase()) || (t.company || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterRating || t.rating === filterRating)
  );

  const avatarColors = [BRAND, '#E63946', '#10B981', '#F59E0B', '#8B5CF6'];

  if (loading) return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ height: '32px', width: '180px', background: '#eee', borderRadius: '8px' }} />
        <div style={{ height: '36px', width: '160px', background: '#eee', borderRadius: '8px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e5e5' }}>
            <div style={{ height: '60px', background: '#eee', borderRadius: '4px', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#eee', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: '14px', background: '#eee', borderRadius: '4px', marginBottom: '0.4rem', width: '60%' }} />
                <div style={{ height: '12px', background: '#eee', borderRadius: '4px', width: '40%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}div[style*="background: #eee"]{animation:pulse 1.5s ease infinite}`}</style>
    </div>
  );

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: toast.type === 'success' ? '#10B981' : '#E63946', color: 'white', padding: '0.875rem 1.25rem', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.625rem', zIndex: 2000, fontSize: '0.9rem', fontWeight: '500' }}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />} {toast.message}
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: '#fee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><Trash2 size={24} color="#E63946" /></div>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Delete Testimonial?</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '0.7rem 1.5rem', border: '1.5px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: '8px', background: '#E63946', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1c1c1e' }}>Testimonials</h2>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '2px' }}>{filtered.length} of {testimonials.length} testimonials</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '0.875rem', width: '180px', outline: 'none' }} />
          </div>
          {/* Star filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f8f8f8', borderRadius: '8px', padding: '0.3rem 0.6rem', border: '1.5px solid #e0e0e0' }}>
            <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: '600' }}>Filter:</span>
            {[0, 5, 4, 3, 2, 1].map(r => (
              <button key={r} onClick={() => setFilterRating(filterRating === r ? 0 : r)} style={{ background: filterRating === r ? '#F59E0B' : 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem 0.4rem', borderRadius: '5px', fontSize: '0.78rem', fontWeight: '600', color: filterRating === r ? 'white' : '#888', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {r === 0 ? 'All' : <><Star size={12} fill={filterRating === r ? 'white' : '#F59E0B'} color={filterRating === r ? 'white' : '#F59E0B'} />{r}</>}
              </button>
            ))}
          </div>
          <button onClick={openCreate} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', fontSize: '0.875rem' }}>
            <Plus size={17} /> Add Testimonial
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ background: 'white', padding: '5rem 2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e5e5' }}>
          <div style={{ width: '72px', height: '72px', background: BRAND_LIGHT, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}><MessageSquare size={36} color={BRAND} /></div>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#1c1c1e' }}>{search || filterRating ? 'No testimonials match' : 'No testimonials yet'}</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{search || filterRating ? 'Try adjusting your filters.' : 'Add your first client testimonial.'}</p>
          {!search && !filterRating && <button onClick={openCreate} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Add Testimonial</button>}
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((t, idx) => {
            const color = avatarColors[idx % avatarColors.length];
            return (
              <div key={t._id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e8e8', padding: '1.4rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                  <StarRating value={t.rating || 0} />
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button onClick={() => openEdit(t)} style={{ background: 'transparent', border: '1.5px solid #e0e0e0', cursor: 'pointer', padding: '0.35rem', borderRadius: '7px', display: 'flex' }}><Edit size={14} /></button>
                    <button onClick={() => setDeleteConfirm(t._id)} style={{ background: 'transparent', border: '1.5px solid #fecdd3', cursor: 'pointer', padding: '0.35rem', borderRadius: '7px', color: '#E63946', display: 'flex' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <p style={{ color: '#444', fontSize: '0.875rem', lineHeight: '1.65', flex: 1, fontStyle: 'italic', marginBottom: '1.1rem' }}>
                  "{t.content.slice(0, 180)}{t.content.length > 180 ? '…' : ''}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f5f5f5' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: t.avatar ? `url(${t.avatar}) center/cover` : color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                    {!t.avatar && initials(t.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1c1c1e' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888' }}>{t.role}{t.company ? ` · ${t.company}` : ''}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '560px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '1.4rem 1.75rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontWeight: '700', fontSize: '1.15rem', color: '#1c1c1e' }}>{editing ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '2px' }}>{editing ? `Editing "${editing.name}"` : 'Add a client review'}</p>
              </div>
              <button onClick={closeForm} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', color: '#555' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Preview card */}
                <div style={{ background: '#f8f9fc', borderRadius: '12px', padding: '1rem', border: '1.5px solid #ebebf5' }}>
                  <StarRating value={formData.rating} />
                  <p style={{ color: '#555', fontSize: '0.82rem', lineHeight: '1.6', margin: '0.625rem 0', fontStyle: 'italic', minHeight: '2.5rem' }}>
                    {formData.content ? `"${formData.content.slice(0, 100)}${formData.content.length > 100 ? '…' : ''}"` : <span style={{ color: '#ccc' }}>Quote preview…</span>}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: formData.avatar ? `url(${formData.avatar}) center/cover` : BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '700', color: 'white' }}>
                      {!formData.avatar && (formData.name ? initials(formData.name) : '?')}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.82rem' }}>{formData.name || <span style={{ color: '#ccc' }}>Name</span>}</div>
                      <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{formData.role || 'Role'}{formData.company ? ` · ${formData.company}` : ''}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={labelStyle}>Name <span style={{ color: '#E63946' }}>*</span></label>
                    <input required value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Role <span style={{ color: '#E63946' }}>*</span></label>
                    <input required value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))} placeholder="CEO" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Company</label>
                    <input value={formData.company} onChange={e => setFormData(f => ({ ...f, company: e.target.value }))} placeholder="Acme Inc." style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Avatar URL</label>
                  <input value={formData.avatar} onChange={e => setFormData(f => ({ ...f, avatar: e.target.value }))} placeholder="https://…" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Quote <span style={{ color: '#E63946' }}>*</span></label>
                  <textarea required value={formData.content} onChange={e => setFormData(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="What the client said…" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={labelStyle}>Rating</label>
                  <StarRating value={formData.rating} onChange={v => setFormData(f => ({ ...f, rating: v }))} />
                </div>
              </div>
              <div style={{ padding: '1.1rem 1.75rem', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', flexShrink: 0, background: '#fafafa' }}>
                <button type="button" onClick={closeForm} style={{ padding: '0.7rem 1.25rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: '8px', background: saving ? '#a0b0d0' : BRAND, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Add Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
