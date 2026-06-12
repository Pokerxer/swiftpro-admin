'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { settingsAPI } from '@/lib/api';
import { Plus, Trash2, X, Mail, Phone, MapPin, MessageCircle, Save } from 'lucide-react';

const BRAND = '#0A2463';

interface CompanySettings {
  phone: string;
  phoneRaw: string;
  whatsappMessage: string;
  address: string;
  emails: string[];
}

const empty: CompanySettings = { phone: '', phoneRaw: '', whatsappMessage: '', address: '', emails: [''] };

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
    <div style={{ display: 'grid', gap: '1rem', maxWidth: 640 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', height: 120 }}>
          <div style={{ height: 14, width: '40%', background: '#e5e7eb', borderRadius: 4, marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 38, width: '100%', background: '#e5e7eb', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [form, setForm] = useState<CompanySettings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    fetchSettings();
  }, [isAuthenticated, router]);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      const data = res.data;
      setForm({
        phone: data.phone || '',
        phoneRaw: data.phoneRaw || '',
        whatsappMessage: data.whatsappMessage || '',
        address: data.address || '',
        emails: data.emails?.length ? data.emails : [''],
      });
    } catch { /* keep empty form */ } finally { setLoading(false); }
  };

  const setEmail = (idx: number, value: string) => {
    setForm(f => ({ ...f, emails: f.emails.map((e, i) => (i === idx ? value : e)) }));
  };

  const addEmail = () => setForm(f => ({ ...f, emails: [...f.emails, ''] }));

  const removeEmail = (idx: number) => {
    setForm(f => ({ ...f, emails: f.emails.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = form.emails.map(em => em.trim()).filter(Boolean);
    if (emails.length === 0) {
      setToast({ msg: 'At least one email address is required', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await settingsAPI.update({ ...form, phoneRaw: form.phoneRaw.replace(/\D/g, ''), emails });
      setForm(f => ({ ...f, emails }));
      setToast({ msg: 'Settings saved', type: 'success' });
    } catch {
      setToast({ msg: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', width: '100%', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: '0.8rem', fontWeight: 600 as const, color: '#374151', display: 'flex' as const, alignItems: 'center' as const, gap: '0.4rem', marginBottom: '0.35rem' };
  const cardStyle = { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' };
  const hintStyle = { fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.25rem' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: BRAND }}>Settings</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Company contact details shown on the public website</p>
        </div>
      </div>

      {loading ? <Skeleton /> : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: 640 }}>
          {/* WhatsApp & Phone */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: BRAND, margin: '0 0 1rem' }}>WhatsApp & Phone</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}><MessageCircle size={14} /> WhatsApp Number *</label>
                <input value={form.phoneRaw} onChange={e => setForm(f => ({ ...f, phoneRaw: e.target.value }))} required placeholder="e.g. 2348057955859" style={inputStyle} />
                <p style={hintStyle}>Digits only, with country code — used for the wa.me chat link</p>
              </div>
              <div>
                <label style={labelStyle}><Phone size={14} /> Phone (display) *</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required placeholder="e.g. +234 805 795 5859" style={inputStyle} />
                <p style={hintStyle}>Shown on the site and used for tap-to-call links</p>
              </div>
              <div>
                <label style={labelStyle}><MessageCircle size={14} /> WhatsApp Greeting Message</label>
                <textarea value={form.whatsappMessage} onChange={e => setForm(f => ({ ...f, whatsappMessage: e.target.value }))} rows={2} placeholder="Pre-filled message when visitors open WhatsApp" style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }} />
              </div>
            </div>
          </div>

          {/* Email addresses */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: BRAND, margin: 0 }}>Email Addresses</h2>
              <button type="button" onClick={addEmail} style={{ background: '#EFF6FF', color: '#3A86FF', border: 'none', padding: '0.5rem 0.875rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.8rem' }}>
                <Plus size={15} /> Add Email
              </button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {form.emails.map((email, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}><Mail size={14} /> {idx === 0 ? 'Primary Email *' : `Email ${idx + 1}`}</label>
                    <input type="email" value={email} onChange={e => setEmail(idx, e.target.value)} required={idx === 0} placeholder="e.g. info@company.com" style={inputStyle} />
                  </div>
                  {form.emails.length > 1 && (
                    <button type="button" onClick={() => removeEmail(idx)} style={{ background: '#FEF2F2', border: 'none', cursor: 'pointer', padding: '0.6rem', borderRadius: '6px', color: '#E63946', display: 'flex', alignItems: 'center', marginTop: '1.35rem' }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p style={hintStyle}>All emails are listed on the website. The primary email is used for structured data and contact links.</p>
          </div>

          {/* Address */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: BRAND, margin: '0 0 1rem' }}>Office Address</h2>
            <div>
              <label style={labelStyle}><MapPin size={14} /> Address *</label>
              <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required rows={2} placeholder="Street, city, country" style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{ background: saving ? '#6B7280' : BRAND, color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
