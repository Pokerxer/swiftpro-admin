'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { partnersAPI } from '@/lib/api';
import { Plus, Edit, Trash2, X, Users, GripVertical, Eye, EyeOff, ExternalLink, Upload, ImagePlus, Link2 } from 'lucide-react';

const BRAND = '#0A2463';

interface Partner {
  _id: string;
  name: string;
  color: string;
  logo: string;
  website: string;
  order: number;
  isActive: boolean;
}

const emptyForm = {
  name: '',
  color: '#0A2463',
  logo: '',
  website: '',
  order: 0,
  isActive: true,
};

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: '1rem', left: '1rem', right: '1rem', background: type === 'success' ? '#10B981' : '#E63946', color: 'white', padding: '0.875rem 1rem', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '320px' }} className="toast-notification">
      <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, flexShrink: 0 }}><X size={16} /></button>
    </div>
  );
}

export default function PartnersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchPartners();
  }, [isAuthenticated, router]);

  const fetchPartners = async () => {
    try {
      const res = await partnersAPI.getAll();
      setPartners(res.data);
    } catch {
      setToast({ msg: 'Failed to load partners', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setFormData({
      name: p.name,
      color: p.color || '#0A2463',
      logo: p.logo || '',
      website: p.website || '',
      order: p.order || 0,
      isActive: p.isActive !== false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setToast({ msg: 'Please choose an image file', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ msg: 'Image too large (max 5MB)', type: 'error' });
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          // Resize to a max width of 400px so the stored logo stays small
          const MAX_W = 400;
          const scale = Math.min(1, MAX_W / img.width);
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');
          ctx.drawImage(img, 0, 0, w, h);
          // JPEG for photos (no transparency), PNG otherwise (keeps logo transparency)
          const useJpeg = file.type === 'image/jpeg' || file.type === 'image/webp';
          const dataUrl = canvas.toDataURL(useJpeg ? 'image/jpeg' : 'image/png', 0.88);
          if (dataUrl.length > 1_500_000) {
            setToast({ msg: 'Image too detailed — please use a simpler logo', type: 'error' });
            setUploading(false);
            return;
          }
          setFormData(f => ({ ...f, logo: dataUrl }));
          setUploading(false);
        } catch {
          setUploading(false);
          setToast({ msg: 'Could not process image', type: 'error' });
        }
      };
      img.onerror = () => {
        setUploading(false);
        setToast({ msg: 'Could not read image file', type: 'error' });
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setUploading(false);
      setToast({ msg: 'Could not read file', type: 'error' });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await partnersAPI.update(editing._id, formData);
        setToast({ msg: 'Partner updated', type: 'success' });
      } else {
        await partnersAPI.create(formData);
        setToast({ msg: 'Partner added', type: 'success' });
      }
      closeForm();
      fetchPartners();
    } catch {
      setToast({ msg: 'Failed to save partner', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await partnersAPI.delete(deleteTarget._id);
      setToast({ msg: 'Partner deleted', type: 'success' });
      setDeleteTarget(null);
      fetchPartners();
    } catch {
      setToast({ msg: 'Failed to delete partner', type: 'error' });
    }
  };

  const inputStyle = { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', width: '100%', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' };

  const previewStyle = (p: Partner) => ({
    fontSize: '1.5rem',
    fontWeight: 700,
    color: p.color || BRAND,
    opacity: p.isActive === false ? 0.4 : 1,
    filter: p.isActive === false ? 'grayscale(100%)' : 'none',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <main style={{ padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: BRAND, margin: 0 }}>Partners</h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Manage trusted partner logos</p>
          </div>
          <button onClick={openCreate} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            <Plus size={18} /> Add Partner
          </button>
        </div>

        {/* Info Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={20} style={{ color: BRAND }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#111', margin: '0 0 4px', fontSize: '0.9rem' }}>Trusted By Section</p>
            <p style={{ color: '#6B7280', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
              These partners appear in the scrolling logo bar on the homepage. Partners with &quot;Inactive&quot; status will be hidden from the public site. Upload a logo image and it will replace the text name on the site.
            </p>
          </div>
        </div>

        {/* Partners List */}
        {loading ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '8px', background: '#e5e7eb', animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1, display: 'grid', gap: '0.4rem' }}>
                  <div style={{ height: 14, width: '30%', background: '#e5e7eb', borderRadius: 4 }} />
                  <div style={{ height: 12, width: '50%', background: '#e5e7eb', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {partners.length === 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                <Users size={40} style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p style={{ fontWeight: 500 }}>No partners yet</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Add your first trusted partner</p>
              </div>
            )}
            {partners.map((p) => (
              <div key={p._id} style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', opacity: p.isActive === false ? 0.6 : 1 }}>
                <div style={{ width: 48, height: 48, borderRadius: '8px', background: `${p.color || BRAND}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {p.logo ? (
                    <img src={p.logo} alt={`${p.name} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 4, background: '#fff' }} />
                  ) : (
                    <span style={previewStyle(p)}>{p.name.charAt(0)}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: '#111', margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {p.name}
                    {p.isActive === false && (
                      <span style={{ fontSize: '0.7rem', background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>Inactive</span>
                    )}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '4px', flexWrap: 'wrap' }}>
                    {p.website && (
                      <span style={{ fontSize: '0.78rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ExternalLink size={12} /> {p.website}
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Order: {p.order}
                    </span>
                    {p.logo && (
                      <span style={{ fontSize: '0.78rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ImagePlus size={12} /> Logo
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(p)} style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', color: '#374151', display: 'flex', alignItems: 'center' }} title="Edit"><Edit size={16} /></button>
                  <button onClick={() => setDeleteTarget(p)} style={{ background: '#FEF2F2', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', color: '#E63946', display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }} onClick={e => e.target === e.currentTarget && closeForm()}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', margin: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: BRAND, margin: 0 }}>{editing ? 'Edit Partner' : 'Add Partner'}</h2>
                <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0' }}>{editing ? `Editing "${editing.name}"` : 'Add a new trusted partner'}</p>
              </div>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ overflow: 'auto', flex: 1 }}>
              <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                {/* Preview */}
                <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '1rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '8px', background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {formData.logo ? (
                      <img src={formData.logo} alt={formData.name || 'Partner logo'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: formData.color }}>{formData.name ? formData.name.charAt(0) : 'P'}</span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1.1rem', color: formData.color, margin: 0 }}>{formData.name || 'Partner Name'}</p>
                    <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>Preview</p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label style={labelStyle}>Partner Name *</label>
                  <input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. First Bank of Nigeria" style={inputStyle} />
                </div>

                {/* Logo Image */}
                <div>
                  <label style={labelStyle}>Partner Logo</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoFile(file);
                      e.target.value = '';
                    }}
                  />
                  {formData.logo ? (
                    <div style={{ background: '#F9FAFB', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={formData.logo} alt="Logo preview" style={{ width: 56, height: 56, objectFit: 'contain', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#111' }}>Logo ready</p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#6B7280' }}>Auto-resized for the homepage logo bar</p>
                      </div>
                      <button type="button" onClick={() => setFormData(f => ({ ...f, logo: '' }))} style={{ background: '#FEF2F2', border: 'none', color: '#E63946', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center' }} title="Remove image"><Trash2 size={15} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: '100%', background: '#F9FAFB', border: '1.5px dashed #CBD5E1', borderRadius: '10px', padding: '1.25rem', cursor: uploading ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: '#64748B', transition: 'all 0.2s' }}>
                      <ImagePlus size={22} style={{ color: BRAND }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{uploading ? 'Processing image...' : 'Upload logo image'}</span>
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>PNG, JPG or WebP — max 5MB</span>
                    </button>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
                    <Link2 size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                    <input value={formData.logo.startsWith('data:') ? '' : formData.logo} onChange={e => setFormData(f => ({ ...f, logo: e.target.value }))} placeholder="...or paste an image URL" style={{ ...inputStyle, fontSize: '0.82rem' }} />
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label style={labelStyle}>Brand Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="color" value={formData.color} onChange={e => setFormData(f => ({ ...f, color: e.target.value }))} style={{ width: 48, height: 40, padding: '4px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }} />
                    <input value={formData.color} onChange={e => setFormData(f => ({ ...f, color: e.target.value }))} placeholder="#0A2463" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label style={labelStyle}>Website URL</label>
                  <input value={formData.website} onChange={e => setFormData(f => ({ ...f, website: e.target.value }))} placeholder="https://www.example.com" style={inputStyle} />
                </div>

                {/* Order */}
                <div>
                  <label style={labelStyle}>Display Order</label>
                  <input type="number" value={formData.order} onChange={e => setFormData(f => ({ ...f, order: Number(e.target.value) }))} style={inputStyle} />
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '4px 0 0' }}>Lower numbers appear first</p>
                </div>

                {/* Active Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#F9FAFB', padding: '0.875rem 1rem', borderRadius: '8px' }}>
                  <button type="button" onClick={() => setFormData(f => ({ ...f, isActive: !f.isActive }))} style={{ width: 44, height: 24, borderRadius: '12px', border: 'none', background: formData.isActive ? '#10B981' : '#D1D5DB', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: formData.isActive ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#111' }}>{formData.isActive ? 'Active' : 'Inactive'}</p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B7280' }}>{formData.isActive ? 'Visible on website' : 'Hidden from public'}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', background: '#FAFAFA' }}>
                <button type="button" onClick={closeForm} style={{ background: 'white', border: '1px solid #ddd', padding: '0.625rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#6B7280' : BRAND, color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '6px', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>{saving ? 'Saving...' : editing ? 'Update Partner' : 'Add Partner'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={22} color="#E63946" /></div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111', marginBottom: '0.5rem' }}>Delete Partner?</h3>
            <p style={{ color: '#6B7280', marginBottom: '1.25rem', fontSize: '0.85rem' }}>&quot;{deleteTarget.name}&quot; will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: 'white', border: '1px solid #ddd', padding: '0.625rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex: 1, background: '#E63946', color: 'white', border: 'none', padding: '0.625rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
