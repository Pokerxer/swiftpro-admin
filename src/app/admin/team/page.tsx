'use client';

import { useEffect, useState } from 'react';
import { teamAPI } from '@/lib/api';
import { Plus, Edit, Trash2, Search, X, Check, AlertCircle, Users, Mail, Linkedin } from 'lucide-react';

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedin: string;
  email: string;
  order: number;
}

interface FormData {
  name: string; role: string; bio: string; image: string;
  linkedin: string; email: string; order: number;
}

const BRAND = '#0A2463';
const BRAND_LIGHT = '#e8edf7';
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.7rem 0.875rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', background: '#fff' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.78rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' };

const emptyForm: FormData = { name: '', role: '', bio: '', image: '', linkedin: '', email: '', order: 0 };

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  useEffect(() => { fetchTeam(); }, []);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }
  }, [toast]);

  const fetchTeam = async () => {
    setLoading(true);
    try { const res = await teamAPI.getAll(); setTeam(res.data); }
    catch { showToast('Failed to load team members', 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });
  const openCreate = () => { setEditing(null); setFormData(emptyForm); setShowForm(true); };
  const openEdit = (m: TeamMember) => { setEditing(m); setFormData({ name: m.name, role: m.role, bio: m.bio || '', image: m.image || '', linkedin: m.linkedin || '', email: m.email || '', order: m.order || 0 }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await teamAPI.update(editing._id, formData); showToast('Member updated', 'success'); }
      else { await teamAPI.create(formData); showToast('Member added', 'success'); }
      closeForm(); fetchTeam();
    } catch { showToast('Failed to save member', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await teamAPI.delete(id); showToast('Member removed', 'success'); setDeleteConfirm(null); fetchTeam(); }
    catch { showToast('Failed to delete member', 'error'); }
  };

  const filtered = team.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  const avatarColors = [BRAND, '#E63946', '#10B981', '#F59E0B', '#8B5CF6', '#3A86FF'];

  if (loading) return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ height: '32px', width: '160px', background: '#eee', borderRadius: '8px' }} />
        <div style={{ height: '36px', width: '140px', background: '#eee', borderRadius: '8px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e5e5', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#eee', margin: '0 auto 1rem' }} />
            <div style={{ height: '16px', background: '#eee', borderRadius: '4px', marginBottom: '0.5rem', width: '60%', margin: '0 auto 0.5rem' }} />
            <div style={{ height: '13px', background: '#eee', borderRadius: '4px', width: '40%', margin: '0 auto' }} />
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
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Remove Team Member?</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '0.7rem 1.5rem', border: '1.5px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: '8px', background: '#E63946', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1c1c1e' }}>Team Members</h2>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '2px' }}>{filtered.length} of {team.length} members</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '0.875rem', width: '200px', outline: 'none' }} />
          </div>
          <button onClick={openCreate} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', fontSize: '0.875rem' }}>
            <Plus size={17} /> Add Member
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ background: 'white', padding: '5rem 2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e5e5' }}>
          <div style={{ width: '72px', height: '72px', background: BRAND_LIGHT, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}><Users size={36} color={BRAND} /></div>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#1c1c1e' }}>{search ? 'No members match' : 'No team members yet'}</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{search ? 'Try a different name or role.' : 'Add your first team member.'}</p>
          {!search && <button onClick={openCreate} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Add Member</button>}
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((m, idx) => {
            const color = avatarColors[idx % avatarColors.length];
            return (
              <div key={m._id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e8e8', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ height: '6px', background: color }} />
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: m.image ? `url(${m.image}) center/cover` : color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.3rem', fontWeight: '700', color: 'white' }}>
                    {!m.image && initials(m.name)}
                  </div>
                  <h3 style={{ fontWeight: '700', fontSize: '1rem', color: '#1c1c1e', marginBottom: '0.25rem' }}>{m.name}</h3>
                  <p style={{ color: color, fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.75rem' }}>{m.role}</p>
                  {m.bio && <p style={{ color: '#666', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '0.875rem' }}>{m.bio.slice(0, 100)}{m.bio.length > 100 ? '…' : ''}</p>}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    {m.email && <a href={`mailto:${m.email}`} style={{ color: '#aaa', display: 'flex' }} title={m.email}><Mail size={16} /></a>}
                    {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', display: 'flex' }}><Linkedin size={16} /></a>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEdit(m)} style={{ flex: 1, background: BRAND_LIGHT, border: 'none', color: BRAND, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}><Edit size={14} /> Edit</button>
                    <button onClick={() => setDeleteConfirm(m._id)} style={{ flex: 1, background: '#fff0f0', border: 'none', color: '#E63946', padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}><Trash2 size={14} /> Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, padding: '0' }} onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div style={{ background: 'white', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', margin: 0 }}>
            <div style={{ padding: '1.4rem 1.75rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontWeight: '700', fontSize: '1.15rem', color: '#1c1c1e' }}>{editing ? 'Edit Member' : 'Add Team Member'}</h3>
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '2px' }}>{editing ? `Editing "${editing.name}"` : 'Fill in the member details'}</p>
              </div>
              <button onClick={closeForm} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', color: '#555' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Avatar preview */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: '#f8f9fc', borderRadius: '12px', border: '1.5px solid #ebebf5' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: formData.image ? `url(${formData.image}) center/cover` : BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                    {!formData.image && (formData.name ? initials(formData.name) : '?')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: formData.name ? '#1c1c1e' : '#bbb' }}>{formData.name || 'Member Name'}</div>
                    <div style={{ fontSize: '0.82rem', color: formData.role ? BRAND : '#bbb', fontWeight: '500' }}>{formData.role || 'Role'}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Name <span style={{ color: '#E63946' }}>*</span></label>
                    <input required value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Full name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Role <span style={{ color: '#E63946' }}>*</span></label>
                    <input required value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Lead Engineer" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Image URL</label>
                  <input value={formData.image} onChange={e => setFormData(f => ({ ...f, image: e.target.value }))} placeholder="https://…" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="name@company.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Display Order</label>
                    <input type="number" value={formData.order} onChange={e => setFormData(f => ({ ...f, order: Number(e.target.value) }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>LinkedIn URL</label>
                  <input value={formData.linkedin} onChange={e => setFormData(f => ({ ...f, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/…" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Bio</label>
                  <textarea value={formData.bio} onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="A short bio…" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ padding: '1.1rem 1.75rem', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', flexShrink: 0, background: '#fafafa' }}>
                <button type="button" onClick={closeForm} style={{ padding: '0.7rem 1.25rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: '8px', background: saving ? '#a0b0d0' : BRAND, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                  {saving ? 'Saving…' : editing ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
