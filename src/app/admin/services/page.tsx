'use client';

import { useEffect, useState, useRef } from 'react';
import { servicesAPI } from '@/lib/api';
import {
  Plus, Edit, Trash2, Search, Grid, List, X, Check, ChevronUp, ChevronDown,
  Server, Shield, Cloud, Database, Lock, Globe, Monitor, Wifi, Cpu, Terminal,
  Settings, FileText, Code, Zap, BarChart2, Users, Headphones, Package,
  Layers, Link, Eye, EyeOff, GripVertical, AlertCircle, Wrench, Sparkles,
  FileCode, Rocket, Lightbulb, ShieldCheck, HardDrive, Box, Star, ArrowUpDown,
  EyeOff as EyeOffIcon, ExternalLink, Clock, CheckCircle2, Circle, SortAsc,
} from 'lucide-react';

interface ProcessStep {
  title: string;
  description: string;
}

interface Service {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  description: string;
  icon: string;
  features: string[];
  processSteps: ProcessStep[];
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  pricing?: string;
  deliveryTime?: string;
}

interface FormData {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  features: string[];
  processSteps: ProcessStep[];
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  pricing?: string;
  deliveryTime?: string;
}

const ICONS: { name: string; component: React.FC<{ size?: number; color?: string }> }[] = [
  { name: 'Server', component: Server },
  { name: 'Shield', component: Shield },
  { name: 'Cloud', component: Cloud },
  { name: 'Database', component: Database },
  { name: 'Lock', component: Lock },
  { name: 'Globe', component: Globe },
  { name: 'Monitor', component: Monitor },
  { name: 'Wifi', component: Wifi },
  { name: 'Cpu', component: Cpu },
  { name: 'Terminal', component: Terminal },
  { name: 'Settings', component: Settings },
  { name: 'FileText', component: FileText },
  { name: 'Code', component: Code },
  { name: 'Zap', component: Zap },
  { name: 'BarChart2', component: BarChart2 },
  { name: 'Users', component: Users },
  { name: 'Headphones', component: Headphones },
  { name: 'Package', component: Package },
  { name: 'Layers', component: Layers },
  { name: 'Link', component: Link },
  { name: 'Wrench', component: Wrench },
  { name: 'Sparkles', component: Sparkles },
  { name: 'FileCode', component: FileCode },
  { name: 'Rocket', component: Rocket },
  { name: 'Lightbulb', component: Lightbulb },
  { name: 'ShieldCheck', component: ShieldCheck },
  { name: 'HardDrive', component: HardDrive },
  { name: 'Box', component: Box },
];

const BRAND = '#0A2463';
const ACCENT = '#3A86FF';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getIconComponent(name: string) {
  const found = ICONS.find(i => i.name === name);
  return found ? found.component : Server;
}

const emptyForm: FormData = {
  title: '',
  slug: '',
  shortDescription: '',
  fullDescription: '',
  icon: 'Server',
  features: [''],
  processSteps: [{ title: '', description: '' }],
  order: 0,
  isActive: true,
  isFeatured: false,
  pricing: '',
  deliveryTime: '',
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'steps' | 'settings'>('basic');
  const [editing, setEditing] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'date'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  useEffect(() => { fetchServices(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (!slugManual && formData.title) {
      setFormData(f => ({ ...f, slug: slugify(f.title) }));
    }
  }, [formData.title, slugManual]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await servicesAPI.getAll();
      setServices(res.data);
    } catch {
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setSlugManual(false);
    setActiveTab('basic');
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setFormData({
      title: service.title,
      slug: service.slug || slugify(service.title),
      shortDescription: service.shortDescription || '',
      fullDescription: service.fullDescription || service.description || '',
      icon: service.icon || 'Server',
      features: service.features.length ? service.features : [''],
      processSteps: service.processSteps?.length ? service.processSteps : [{ title: '', description: '' }],
      order: service.order,
      isActive: service.isActive !== false,
      isFeatured: service.isFeatured === true,
      pricing: service.pricing || '',
      deliveryTime: service.deliveryTime || '',
    });
    setSlugManual(true);
    setActiveTab('basic');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...formData,
      features: formData.features.filter(f => f.trim()),
      processSteps: formData.processSteps.filter(s => s.title.trim()),
    };
    try {
      if (editing) {
        await servicesAPI.update(editing._id, payload);
        showToast('Service updated', 'success');
      } else {
        await servicesAPI.create(payload);
        showToast('Service created', 'success');
      }
      closeForm();
      fetchServices();
    } catch {
      showToast('Failed to save service', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await servicesAPI.delete(id);
      showToast('Service deleted', 'success');
      setDeleteConfirm(null);
      fetchServices();
    } catch {
      showToast('Failed to delete service', 'error');
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      await servicesAPI.update(service._id, { isActive: !service.isActive });
      showToast(`Service ${service.isActive === false ? 'activated' : 'deactivated'}`, 'success');
      fetchServices();
    } catch {
      showToast('Failed to update service status', 'error');
    }
  };

  const toggleFeatured = async (service: Service) => {
    try {
      await servicesAPI.update(service._id, { isFeatured: !service.isFeatured });
      showToast(`Service ${service.isFeatured ? 'unfeatured' : 'featured'}`, 'success');
      fetchServices();
    } catch {
      showToast('Failed to update featured status', 'error');
    }
  };

  const setFeature = (i: number, val: string) => {
    const next = [...formData.features];
    next[i] = val;
    setFormData(f => ({ ...f, features: next }));
  };
  const addFeature = () => setFormData(f => ({ ...f, features: [...f.features, ''] }));
  const removeFeature = (i: number) => setFormData(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  const setStep = (i: number, field: 'title' | 'description', val: string) => {
    const next = [...formData.processSteps];
    next[i] = { ...next[i], [field]: val };
    setFormData(f => ({ ...f, processSteps: next }));
  };
  const addStep = () => setFormData(f => ({ ...f, processSteps: [...f.processSteps, { title: '', description: '' }] }));
  const removeStep = (i: number) => setFormData(f => ({ ...f, processSteps: f.processSteps.filter((_, idx) => idx !== i) }));
  const moveStep = (i: number, dir: -1 | 1) => {
    const next = [...formData.processSteps];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setFormData(f => ({ ...f, processSteps: next }));
  };

  const filteredServices = services
    .filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.shortDescription || s.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesActive = filterActive === null || (s.isActive !== false) === filterActive;
      return matchesSearch && matchesActive;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (sortBy === 'order') {
        return sortOrder === 'asc' ? a.order - b.order : b.order - a.order;
      }
      return 0;
    });

  const IconComp = getIconComponent(formData.icon);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, background: '#E5E7EB', borderRadius: '12px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ height: 28, width: 128, background: '#E5E7EB', borderRadius: '9px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              <div style={{ height: 16, width: 96, background: '#E5E7EB', borderRadius: '9px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
          </div>
          <div style={{ height: 48, width: 288, background: '#E5E7EB', borderRadius: '12px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ width: 56, height: 56, background: '#F3F4F6', borderRadius: '12px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ width: 32, height: 32, background: '#F3F4F6', borderRadius: '8px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div style={{ width: 32, height: 32, background: '#F3F4F6', borderRadius: '8px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                </div>
              </div>
              <div style={{ height: 20, width: '75%', background: '#F3F4F6', borderRadius: '8px', marginBottom: '0.75rem', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              <div style={{ height: 12, width: '50%', background: '#F3F4F6', borderRadius: '8px', marginBottom: '1rem', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              <div style={{ height: 16, width: '100%', background: '#F3F4F6', borderRadius: '8px', marginBottom: '0.5rem', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              <div style={{ height: 16, width: '66%', background: '#F3F4F6', borderRadius: '8px', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
        <style>{`
          @keyframes shimmer {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 50,
          fontWeight: 600,
          transition: 'all 0.3s ease',
          background: toast.type === 'success'
            ? 'linear-gradient(to right, #10B981, #059669, #047857)'
            : 'linear-gradient(to right, #EF4444, #DC2626, #B91C1C)'
        }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          </div>
          {toast.message}
          <button onClick={() => setToast(null)} style={{ marginLeft: '0.5rem', padding: '0.25rem', borderRadius: '6px', transition: 'background 0.2s' }} className="toast-close">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }} className="delete-modal">
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '28rem', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transform: 'scale(1)' }} className="delete-modal-inner">
            <div style={{ width: 64, height: 64, background: 'linear-gradient(to bottom right, #FEF2F2, #FEE2E2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
              <Trash2 size={28} style={{ color: '#DC2626' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>Delete Service?</h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>Are you sure you want to delete this service? This action cannot be undone and all associated data will be lost.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '0.75rem 1.5rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontWeight: 600, color: '#4B5563', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }} className="cancel-btn">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(to right, #EF4444, #DC2626)', color: 'white', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)', transform: 'translateY(-2px)' }}>
                Delete Service
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .delete-modal { animation: fadeIn 0.2s ease-out; }
            .delete-modal-inner { animation: scaleIn 0.2s ease-out; }
          `}</style>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'linear-gradient(to bottom right, #0A2463, #3A86FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(10, 36, 99, 0.2)' }}>
              <Wrench size={26} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Services</h2>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500, color: '#374151' }}>{filteredServices.length}</span>
                of {services.length} service{services.length !== 1 ? 's' : ''}
                {search && <span style={{ fontSize: '0.75rem', background: '#F3F4F6', padding: '2px 8px', borderRadius: '9999px' }}>filtered</span>}
                {filterActive !== null && <span style={{ fontSize: '0.75rem', background: '#EFF6FF', color: '#3A86FF', padding: '2px 8px', borderRadius: '9999px' }}>{filterActive ? 'active' : 'inactive'}</span>}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }} className="search-group">
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} className="search-icon" />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.75rem', paddingRight: '1rem', padding: '0.625rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', width: '14rem', background: 'white', outline: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              />
            </div>
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '12px', padding: '6px', gap: '4px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
              {(['grid', 'list'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    background: viewMode === mode ? 'white' : 'transparent',
                    color: viewMode === mode ? '#3A86FF' : '#9CA3AF',
                    boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {mode === 'grid' ? <Grid size={18} /> : <List size={18} />}
                </button>
              ))}
            </div>
            <button onClick={openCreate} style={{ padding: '0.625rem 1.25rem', background: 'linear-gradient(to right, #0A2463, #3A86FF)', color: 'white', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none' }} className="add-btn">
              <Plus size={18} />
              <span>Add Service</span>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SortAsc size={16} style={{ color: '#9CA3AF' }} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'order' | 'title' | 'date')}
              style={{ fontSize: '0.875rem', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.5rem 0.75rem', background: 'white', outline: 'none' }}
            >
              <option value="order">Sort by Order</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              style={{ padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUpDown size={16} style={{ color: '#4B5563', transform: 'rotate(180deg)' }} /> : <ArrowUpDown size={16} style={{ color: '#4B5563' }} />}
            </button>
          </div>
          <div style={{ height: '1.5rem', width: '1px', background: '#E5E7EB' }} />
          <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', borderRadius: '8px', padding: '4px' }}>
            {[
              { label: 'All', value: null },
              { label: 'Active', value: true },
              { label: 'Inactive', value: false },
            ].map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => setFilterActive(opt.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  background: filterActive === opt.value ? 'white' : 'transparent',
                  color: filterActive === opt.value ? '#3A86FF' : '#6B7280',
                  boxShadow: filterActive === opt.value ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {services.filter(s => s.isFeatured).length > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '6px 12px', background: '#FFFBEB', color: '#D97706', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={12} />
              {services.filter(s => s.isFeatured).length} featured
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filteredServices.length === 0 && (
        <div style={{ background: 'white', padding: '6rem 3rem', borderRadius: '24px', textAlign: 'center', border: '2px dashed #E5E7EB', position: 'relative', overflow: 'hidden', marginTop: '1.5rem' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '8rem', height: '8rem', background: 'linear-gradient(to bottom right, rgba(58, 134, 255, 0.05), transparent)', borderRadius: '50%', transform: 'translateY(-50%) translateX(50%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '6rem', height: '6rem', background: 'linear-gradient(to top left, rgba(58, 134, 255, 0.05), transparent)', borderRadius: '50%', transform: 'translateY(50%) translateX(-50%)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ width: '6rem', height: '6rem', borderRadius: '24px', background: 'linear-gradient(to bottom right, #F9FAFB, rgba(58, 134, 255, 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: '16px', background: 'linear-gradient(to bottom right, #0A2463, #3A86FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(10, 36, 99, 0.3)' }}>
                <Wrench size={32} style={{ color: 'white' }} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              {search ? 'No services found' : 'No services yet'}
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '2rem', maxWidth: '28rem', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              {search
                ? `We couldn't find any services matching "${search}". Try adjusting your search terms.`
                : 'Start building your service portfolio by adding your first service. Services help showcase what you offer to clients.'
              }
            </p>
            {!search && (
              <button onClick={openCreate} style={{ padding: '0.875rem 2rem', background: 'linear-gradient(to right, #0A2463, #3A86FF)', color: 'white', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none' }} className="create-btn">
                <Plus size={20} />
                <span>Create First Service</span>
              </button>
            )}
            {search && (
              <button onClick={() => setSearch('')} style={{ padding: '0.625rem 1.5rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontWeight: 500, color: '#4B5563', background: 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={16} />
                <span>Clear Search</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid view */}
      {filteredServices.length > 0 && viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', paddingTop: '1rem' }}>
          {filteredServices.map((service, index) => {
            const Icon = getIconComponent(service.icon);
            return (
              <div
                key={service._id}
                style={{ background: 'white', borderRadius: '16px', border: '1px solid #F3F4F6', overflow: 'hidden', transition: 'all 0.3s' }}
                className="service-card"
              >
                <div style={{ height: 6, background: 'linear-gradient(to right, #0A2463, #3A86FF)', opacity: 0, transition: 'opacity 0.2s' }} className="card-accent" />

                <div style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '12px', background: 'linear-gradient(to bottom right, #0A2463, #3A86FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(10, 36, 99, 0.2)', transition: 'transform 0.2s' }} className="icon-box">
                      <Icon size={26} color="white" />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', opacity: 0, transition: 'opacity 0.2s' }} className="action-btns">
                      <button onClick={() => openEdit(service)} style={{ padding: '10px', background: '#F9FAFB', color: '#4B5563', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} className="edit-btn">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeleteConfirm(service._id)} style={{ padding: '10px', background: '#F9FAFB', color: '#9CA3AF', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} className="delete-btn">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }} className="mobile-actions">
                      <button onClick={() => openEdit(service)} style={{ padding: '8px', background: '#EFF6FF', color: '#3A86FF', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(service._id)} style={{ padding: '8px', background: '#FEF2F2', color: '#EF4444', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#111827', transition: 'color 0.2s' }} className="service-title">{service.title}</h3>
                    {service.isFeatured && (
                      <Star size={14} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                    )}
                  </div>
                  {service.slug && (
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', fontFamily: 'monospace', marginBottom: '0.75rem' }}>/{service.slug}</p>
                  )}
                  <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {(service.shortDescription || service.description || '').slice(0, 120)}
                    {(service.shortDescription || service.description || '').length > 120 ? '...' : ''}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                    {service.pricing && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 12px', background: '#ECFDF5', color: '#059669', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 700 }}>$</span>{service.pricing}
                      </span>
                    )}
                    {service.deliveryTime && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 12px', background: '#FFF7ED', color: '#EA580C', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {service.deliveryTime}
                      </span>
                    )}
                    {service.features.length > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 12px', background: '#EFF6FF', color: '#3A86FF', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={12} />
                        {service.features.length} features
                      </span>
                    )}
                    {service.processSteps?.length > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 12px', background: '#F5F3FF', color: '#7C3AED', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Rocket size={12} />
                        {service.processSteps.length} steps
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#D1D5DB', marginLeft: 'auto', fontWeight: 500 }}>#{service.order}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '#F9FAFB' }}>
                    <button
                      onClick={() => toggleActive(service)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                        border: 'none',
                        cursor: 'pointer',
                        background: service.isActive !== false ? '#ECFDF5' : '#F3F4F6',
                        color: service.isActive !== false ? '#059669' : '#6B7280'
                      }}
                    >
                      {service.isActive !== false ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      {service.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => toggleFeatured(service)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                        border: 'none',
                        cursor: 'pointer',
                        background: service.isFeatured ? '#FFFBEB' : '#F9FAFB',
                        color: service.isFeatured ? '#D97706' : '#9CA3AF'
                      }}
                    >
                      <Star size={12} style={service.isFeatured ? { fill: '#F59E0B' } : {}} />
                      {service.isFeatured ? 'Featured' : 'Feature'}
                    </button>
                    <button style={{ marginLeft: 'auto', padding: '8px', color: '#9CA3AF', cursor: 'pointer', background: 'none', border: 'none', transition: 'color 0.2s' }} title="View service">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {filteredServices.length > 0 && viewMode === 'list' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '1.5rem' }}>
          <table style={{ width: '100%' }}>
              <thead>
              <tr style={{ background: 'linear-gradient(to right, #F9FAFB, white)', borderBottom: '1px solid #E5E7EB' }}>
                {['Icon', 'Title', 'Slug', 'Description', 'Pricing', 'Features', 'Steps', 'Status', 'Order', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '1.25rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service, idx) => {
                const Icon = getIconComponent(service.icon);
                return (
                  <tr key={service._id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'all 0.2s', background: idx % 2 === 0 ? 'white' : 'rgba(249, 250, 251, 0.3)' }} className="list-row">
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(to bottom right, #0A2463, #3A86FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(10, 36, 99, 0.2)' }}>
                        <Icon size={20} color="white" />
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.875rem' }}>{service.title}</div>
                        {service.isFeatured && <Star size={12} style={{ color: '#F59E0B', fill: '#F59E0B' }} />}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#3A86FF', fontFamily: 'monospace', background: '#EFF6FF', padding: '4px 8px', borderRadius: '6px' }}>/{service.slug}</span>
                    </td>
                    <td style={{ padding: '1rem 1rem', color: '#6B7280', fontSize: '0.875rem', maxWidth: '16rem' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {(service.shortDescription || service.description || '').slice(0, 60)}
                        {(service.shortDescription || service.description || '').length > 60 ? '...' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      {service.pricing ? (
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#059669' }}>${service.pricing}</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px', background: '#EFF6FF', color: '#3A86FF', borderRadius: '9999px' }}>
                        {service.features.length}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px', background: '#F5F3FF', color: '#7C3AED', borderRadius: '9999px' }}>
                        {service.processSteps?.length || 0}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <button
                        onClick={() => toggleActive(service)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          borderRadius: '8px',
                          transition: 'all 0.2s',
                          border: 'none',
                          cursor: 'pointer',
                          background: service.isActive !== false ? '#ECFDF5' : '#F3F4F6',
                          color: service.isActive !== false ? '#059669' : '#6B7280'
                        }}
                      >
                        {service.isActive !== false ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                        {service.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '8px', background: '#F3F4F6', color: '#4B5563', fontSize: '0.875rem', fontWeight: 700 }}>
                        {service.order}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(service)} style={{ padding: '8px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #E5E7EB', borderRadius: '8px', color: '#4B5563', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }} className="list-edit-btn">
                          <Edit size={12} />
                        </button>
                        <button onClick={() => setDeleteConfirm(service._id)} style={{ padding: '8px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #FECACA', borderRadius: '8px', color: '#EF4444', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }} className="list-delete-btn">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '48rem', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} className="modal-inner">
            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6', background: 'linear-gradient(to right, #F9FAFB, white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(to bottom right, #0A2463, #3A86FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(10, 36, 99, 0.2)' }}>
                  {editing ? <Edit size={22} style={{ color: 'white' }} /> : <Plus size={22} style={{ color: 'white' }} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>{editing ? 'Edit Service' : 'New Service'}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{editing ? `Editing "${editing.title}"` : 'Fill in the details below to create a new service'}</p>
                </div>
              </div>
              <button onClick={closeForm} style={{ padding: '10px', background: '#F3F4F6', borderRadius: '12px', color: '#6B7280', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #E5E7EB', padding: '0 1.5rem', background: 'linear-gradient(to bottom, #F9FAFB, #F3F4F6)', flexShrink: 0 }}>
              {(['basic', 'content', 'steps', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.875rem 1.25rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '12px 12px 0 0',
                    transition: 'all 0.2s',
                    background: activeTab === tab ? 'white' : 'transparent',
                    color: activeTab === tab ? '#0A2463' : '#6B7280',
                    border: activeTab === tab ? '1px solid #E5E7EB' : '1px solid transparent',
                    borderBottom: activeTab === tab ? 'none' : '1px solid #E5E7EB',
                    marginBottom: activeTab === tab ? '-1px' : 0,
                    borderTop: activeTab === tab ? '3px solid #3A86FF' : '3px solid transparent',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  {tab === 'basic' && <Wrench size={17} />}
                  {tab === 'content' && <FileText size={17} />}
                  {tab === 'steps' && <Rocket size={17} />}
                  {tab === 'settings' && <Settings size={17} />}
                  <span>{tab === 'basic' ? 'Basic Info' : tab === 'content' ? 'Content' : tab === 'steps' ? 'Process Steps' : 'Settings'}</span>
                  {tab === 'content' && formData.features.filter(f => f.trim()).length > 0 && (
                    <span style={{ fontSize: '0.7rem', background: '#3A86FF', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                      {formData.features.filter(f => f.trim()).length}
                    </span>
                  )}
                  {tab === 'steps' && formData.processSteps.filter(s => s.title.trim()).length > 0 && (
                    <span style={{ fontSize: '0.7rem', background: '#8B5CF6', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                      {formData.processSteps.filter(s => s.title.trim()).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <style>{`
              @keyframes modalIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
              .modal-inner { animation: modalIn 0.2s ease-out; }
            `}</style>

            <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              <style>{`
                .form-input {
                  width: 100%;
                  padding: 0.875rem 1rem;
                  border: 1px solid #E5E7EB;
                  border-radius: 12px;
                  font-size: 0.875rem;
                  background: #F9FAFB;
                  outline: none;
                  transition: all 0.2s;
                }
                .form-input:focus {
                  border-color: #3A86FF;
                  box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.1);
                  background: white;
                }
                .form-label {
                  display: block;
                  font-size: 0.875rem;
                  font-weight: 700;
                  color: #374151;
                  margin-bottom: 0.5rem;
                }
                .form-label .required {
                  color: #EF4444;
                }
                .form-section {
                  display: flex;
                  flex-direction: column;
                  gap: 1.25rem;
                }
                .form-row {
                  display: flex;
                  gap: 1.5rem;
                  align-items: stretch;
                }
                .form-col {
                  display: flex;
                  flex-direction: column;
                  gap: 0.5rem;
                }
                .icon-grid {
                  display: grid;
                  grid-template-columns: repeat(7, 1fr);
                  gap: 0.625rem;
                }
                .icon-btn {
                  padding: 14px;
                  border-radius: 12px;
                  border: 2px solid #F3F4F6;
                  background: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  transition: all 0.2s;
                }
                .icon-btn:hover {
                  border-color: #D1D5DB;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .icon-btn.selected {
                  border-color: #3A86FF;
                  background: #EFF6FF;
                  box-shadow: 0 4px 6px -1px rgba(58, 134, 255, 0.2);
                  transform: scale(1.05);
                }
                .preview-box {
                  flex: 1;
                  background: linear-gradient(to bottom right, #F9FAFB, #F3F4F6);
                  border-radius: 12px;
                  padding: 1rem;
                  border: 1px solid #E5E7EB;
                  display: flex;
                  align-items: center;
                  gap: 1rem;
                }
                .preview-icon {
                  width: 56px;
                  height: 56px;
                  border-radius: 12px;
                  background: linear-gradient(to bottom right, #0A2463, #3A86FF);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  box-shadow: 0 10px 15px -3px rgba(10, 36, 99, 0.2);
                }
                .preview-text {
                  overflow: hidden;
                }
                .preview-title {
                  font-weight: 700;
                  color: #111827;
                  font-size: 1rem;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
                .preview-slug {
                  font-size: 0.875rem;
                  color: #3A86FF;
                  font-family: monospace;
                }
                .feature-item {
                  display: flex;
                  gap: 0.75rem;
                  align-items: center;
                  background: white;
                  border-radius: 12px;
                  padding: 0.5rem;
                  border: 1px solid #DBEAFE;
                }
                .feature-number {
                  width: 32px;
                  height: 32px;
                  border-radius: 8px;
                  background: rgba(58, 134, 255, 0.1);
                  color: #3A86FF;
                  font-weight: 700;
                  font-size: 0.875rem;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .feature-input {
                  flex: 1;
                  padding: 0.5rem 0.75rem;
                  border: 0;
                  font-size: 0.875rem;
                  background: transparent;
                  outline: none;
                  border-radius: 8px;
                }
                .step-card {
                  background: white;
                  border-radius: 16px;
                  padding: 1.25rem;
                  border: 2px solid #F3F4F6;
                  transition: all 0.2s;
                }
                .step-card:hover {
                  border-color: #DDD6FE;
                }
                .step-number {
                  width: 40px;
                  height: 40px;
                  border-radius: 12px;
                  background: linear-gradient(to bottom right, #0A2463, #3A86FF);
                  color: white;
                  font-weight: 700;
                  font-size: 1.125rem;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 6px -1px rgba(10, 36, 99, 0.2);
                }
                .step-actions {
                  display: flex;
                  gap: 0.5rem;
                }
                .step-action-btn {
                  padding: 10px;
                  border-radius: 12px;
                  border: 1px solid #E5E7EB;
                  background: white;
                  color: #6B7280;
                  cursor: pointer;
                  transition: all 0.2s;
                }
                .step-action-btn:hover:not(:disabled) {
                  background: #F3F4F6;
                  border-color: #D1D5DB;
                }
                .step-action-btn:disabled {
                  opacity: 0.3;
                  cursor: not-allowed;
                }
                .step-action-btn.delete:hover {
                  background: #FEF2F2;
                  border-color: #FECACA;
                  color: #EF4444;
                }
                .settings-card {
                  background: white;
                  border-radius: 16px;
                  padding: 1.5rem;
                  border: 2px solid #F3F4F6;
                }
                .settings-card-header {
                  display: flex;
                  align-items: center;
                  gap: 0.75rem;
                  margin-bottom: 1rem;
                }
                .settings-icon {
                  width: 40px;
                  height: 40px;
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .toggle-btn {
                  flex: 1;
                  padding: 0.625rem 1rem;
                  border-radius: 12px;
                  font-size: 0.875rem;
                  font-weight: 500;
                  transition: all 0.2s;
                  border: none;
                  cursor: pointer;
                }
                .toggle-btn.active {
                  color: white;
                }
                .toggle-btn.inactive {
                  background: #F3F4F6;
                  color: #6B7280;
                }
                .toggle-btn.inactive:hover {
                  background: #E5E7EB;
                }
                .price-input {
                  width: 100%;
                  padding-left: 2rem;
                  padding: 0.75rem 1rem;
                  border: 1px solid #E5E7EB;
                  border-radius: 12px;
                  font-size: 0.875rem;
                  background: white;
                  outline: none;
                }
                .form-footer {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 1rem 1.5rem;
                  border-top: 1px solid #F3F4F6;
                  background: linear-gradient(to right, #F9FAFB, white);
                  flex-shrink: 0;
                }
                .footer-steps {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                }
                .step-dot {
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  background: #D1D5DB;
                  transition: all 0.2s;
                }
                .step-dot.active {
                  background: #0A2463;
                  width: 24px;
                  border-radius: 4px;
                }
                .footer-actions {
                  display: flex;
                  gap: 0.75rem;
                }
                .cancel-btn {
                  padding: 0.625rem 1.25rem;
                  border: 1px solid #E5E7EB;
                  border-radius: 12px;
                  font-weight: 600;
                  color: #4B5563;
                  background: white;
                  cursor: pointer;
                  transition: all 0.2s;
                }
                .cancel-btn:hover {
                  background: #F3F4F6;
                  border-color: #D1D5DB;
                }
                .continue-btn {
                  padding: 0.625rem 1.25rem;
                  background: #F3F4F6;
                  border-radius: 12px;
                  font-weight: 600;
                  color: #374151;
                  cursor: pointer;
                  transition: all 0.2s;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  border: none;
                }
                .continue-btn:hover {
                  background: #E5E7EB;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .submit-btn {
                  padding: 0.625rem 1.5rem;
                  background: linear-gradient(to right, #0A2463, #3A86FF);
                  color: white;
                  border-radius: 12px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s;
                  border: none;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                }
                .submit-btn:hover:not(:disabled) {
                  box-shadow: 0 10px 15px -3px rgba(10, 36, 99, 0.25);
                  transform: translateY(-2px);
                }
                .submit-btn:disabled {
                  opacity: 0.5;
                  cursor: not-allowed;
                }
                .spinner {
                  width: 16px;
                  height: 16px;
                  border: 2px solid rgba(255, 255, 255, 0.3);
                  border-top-color: white;
                  border-radius: 50%;
                  animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
                .section-header {
                  display: flex;
                  align-items: center;
                  gap: 0.75rem;
                  margin-bottom: 1rem;
                  padding-bottom: 0.75rem;
                  border-bottom: 1px solid #E5E7EB;
                }
                .section-icon {
                  width: 32px;
                  height: 32px;
                  border-radius: 10px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .section-title {
                  font-weight: 700;
                  color: #111827;
                  font-size: 1rem;
                }
                .section-desc {
                  font-size: 0.75rem;
                  color: #6B7280;
                }
                .card-preview {
                  background: white;
                  border-radius: 16px;
                  padding: 1.5rem;
                  border: 1px solid #E5E7EB;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
              `}</style>
              {/* Tab: Basic */}
              {activeTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Service Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
                      Service Title <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      required
                      value={formData.title}
                      onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. IT Infrastructure Management"
                      style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: '#F9FAFB', outline: 'none', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#3A86FF'; e.target.style.boxShadow = '0 0 0 3px rgba(58, 134, 255, 0.1)'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                    />
                  </div>

                  {/* URL Slug */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>URL Slug <span style={{ color: '#EF4444' }}>*</span></label>
                      <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '9999px', fontWeight: 500, background: slugManual ? '#FEF3C7' : '#D1FAE5', color: slugManual ? '#D97706' : '#059669' }}>
                        {slugManual ? 'Manual' : 'Auto-generated'}
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontWeight: 500 }}>/</span>
                      <input
                        required
                        value={formData.slug}
                        onChange={e => { setSlugManual(true); setFormData(f => ({ ...f, slug: slugify(e.target.value) })); }}
                        placeholder="it-infrastructure"
                        style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: '#F9FAFB', outline: 'none', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#3A86FF'; e.target.style.boxShadow = '0 0 0 3px rgba(58, 134, 255, 0.1)'; e.target.style.background = 'white'; }}
                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                      />
                    </div>
                  </div>

                  {/* Choose Icon */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>Choose Icon</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.625rem' }}>
                      {ICONS.map(({ name, component: Ic }) => (
                        <button
                          key={name}
                          type="button"
                          title={name}
                          onClick={() => setFormData(f => ({ ...f, icon: name }))}
                          style={{
                            padding: '14px',
                            borderRadius: '12px',
                            border: formData.icon === name ? '2px solid #3A86FF' : '2px solid #F3F4F6',
                            background: formData.icon === name ? '#EFF6FF' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            transform: formData.icon === name ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: formData.icon === name ? '0 4px 6px -1px rgba(58, 134, 255, 0.2)' : 'none'
                          }}
                        >
                          <Ic size={22} color={formData.icon === name ? '#3A86FF' : '#6B7280'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Short Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
                      Short Description <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea
                      required
                      value={formData.shortDescription}
                      onChange={e => setFormData(f => ({ ...f, shortDescription: e.target.value }))}
                      rows={3}
                      placeholder="Brief summary of this service (shown in cards and listings)..."
                      style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: '#F9FAFB', outline: 'none', transition: 'all 0.2s', resize: 'none' }}
                      onFocus={e => { e.target.style.borderColor = '#3A86FF'; e.target.style.boxShadow = '0 0 0 3px rgba(58, 134, 255, 0.1)'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                    />
                  </div>

                  {/* Order & Preview */}
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
                    <div style={{ width: '7rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Order</label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={e => setFormData(f => ({ ...f, order: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: '#F9FAFB', outline: 'none', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#3A86FF'; e.target.style.boxShadow = '0 0 0 3px rgba(58, 134, 255, 0.1)'; e.target.style.background = 'white'; }}
                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                      />
                    </div>
                    <div style={{ flex: 1, background: 'linear-gradient(to bottom right, #F9FAFB, #F3F4F6)', borderRadius: '12px', padding: '1rem', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(to bottom right, #0A2463, #3A86FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 15px -3px rgba(10, 36, 99, 0.2)' }}>
                        <IconComp size={26} color="white" />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.title || 'Service Title'}</div>
                        <div style={{ fontSize: '0.875rem', color: '#3A86FF', fontFamily: 'monospace' }}>/{formData.slug || 'slug'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Content */}
              {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Full Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Full Description</label>
                    <textarea
                      value={formData.fullDescription}
                      onChange={e => setFormData(f => ({ ...f, fullDescription: e.target.value }))}
                      rows={6}
                      placeholder="Detailed description of the service, methodologies, technologies used, and what clients can expect..."
                      style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: '#F9FAFB', outline: 'none', transition: 'all 0.2s', resize: 'none' }}
                      onFocus={e => { e.target.style.borderColor = '#3A86FF'; e.target.style.boxShadow = '0 0 0 3px rgba(58, 134, 255, 0.1)'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                    />
                  </div>

                  {/* Key Features */}
                  <div style={{ background: 'linear-gradient(to bottom right, #EFF6FF, #EDE9FE)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #BFDBFE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={18} style={{ color: '#3A86FF' }} />
                        <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>Key Features</label>
                      </div>
                      <button type="button" onClick={addFeature} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.5rem 1rem', background: '#3A86FF', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.2s' }}>
                        <Plus size={14} /> Add Feature
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {formData.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'white', borderRadius: '12px', padding: '0.5rem', border: '1px solid #DBEAFE' }}>
                          <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(58, 134, 255, 0.1)', color: '#3A86FF', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {i + 1}
                          </span>
                          <input
                            value={f}
                            onChange={e => setFeature(i, e.target.value)}
                            placeholder={`Feature ${i + 1} - e.g. 24/7 Support`}
                            style={{ flex: 1, padding: '0.5rem 0.75rem', border: '0', fontSize: '0.875rem', background: 'transparent', outline: 'none', borderRadius: '8px' }}
                          />
                          <button type="button" onClick={() => removeFeature(i)} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {formData.features.filter(f => f.trim()).length === 0 && (
                        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', textAlign: 'center', padding: '1rem' }}>No features added yet. Click "Add Feature" to start.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Steps */}
              {activeTab === 'steps' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'linear-gradient(to right, #F3E8FF, #FAF5FF)', padding: '1.25rem', borderRadius: '16px', border: '1px solid #DDD6FE' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(to bottom right, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)' }}>
                        <Rocket size={22} style={{ color: 'white' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#111827' }}>Process Steps</p>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Explain how you deliver this service</p>
                      </div>
                    </div>
                    <button type="button" onClick={addStep} style={{ fontSize: '0.875rem', fontWeight: 700, padding: '0.625rem 1.25rem', background: 'linear-gradient(to right, #8B5CF6, #7C3AED)', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                      <Plus size={18} /> Add Step
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {formData.processSteps.map((step, i) => (
                      <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '2px solid #F3F4F6', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(to bottom right, #0A2463, #3A86FF)', color: 'white', fontWeight: 700, fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(10, 36, 99, 0.2)' }}>
                              {i + 1}
                            </div>
                            <GripVertical size={18} style={{ color: '#D1D5DB' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6B7280' }}>Step {i + 1}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} style={{ padding: '10px', borderRadius: '12px', border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1, transition: 'all 0.2s' }}>
                              <ChevronUp size={18} />
                            </button>
                            <button type="button" onClick={() => moveStep(i, 1)} disabled={i === formData.processSteps.length - 1} style={{ padding: '10px', borderRadius: '12px', border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', cursor: i === formData.processSteps.length - 1 ? 'not-allowed' : 'pointer', opacity: i === formData.processSteps.length - 1 ? 0.3 : 1, transition: 'all 0.2s' }}>
                              <ChevronDown size={18} />
                            </button>
                            <button type="button" onClick={() => removeStep(i)} style={{ padding: '10px', borderRadius: '12px', border: '1px solid #FECACA', background: 'white', color: '#EF4444', cursor: 'pointer', transition: 'all 0.2s' }}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <input
                            value={step.title}
                            onChange={e => setStep(i, 'title', e.target.value)}
                            placeholder="Step title - e.g. Initial Consultation"
                            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: '#F9FAFB', outline: 'none', transition: 'all 0.2s', fontWeight: 500 }}
                            onFocus={e => { e.target.style.borderColor = '#8B5CF6'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'; e.target.style.background = 'white'; }}
                            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                          />
                          <textarea
                            value={step.description}
                            onChange={e => setStep(i, 'description', e.target.value)}
                            placeholder="Describe what happens in this step..."
                            rows={2}
                            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: '#F9FAFB', outline: 'none', transition: 'all 0.2s', resize: 'none' }}
                            onFocus={e => { e.target.style.borderColor = '#8B5CF6'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'; e.target.style.background = 'white'; }}
                            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Settings */}
              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Status & Featured */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    {/* Service Status */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '2px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(to bottom right, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={20} style={{ color: 'white' }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: '#111827' }}>Service Status</p>
                          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Control visibility</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, isActive: true }))}
                          style={{
                            flex: 1,
                            padding: '0.625rem 1rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: formData.isActive ? '#10B981' : '#F3F4F6',
                            color: formData.isActive ? 'white' : '#6B7280'
                          }}
                        >
                          <CheckCircle2 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, isActive: false }))}
                          style={{
                            flex: 1,
                            padding: '0.625rem 1rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: !formData.isActive ? '#6B7280' : '#F3F4F6',
                            color: !formData.isActive ? 'white' : '#6B7280'
                          }}
                        >
                          <Circle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                          Inactive
                        </button>
                      </div>
                    </div>

                    {/* Featured */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '2px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(to bottom right, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Star size={20} style={{ color: 'white' }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: '#111827' }}>Featured</p>
                          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Highlight this service</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, isFeatured: true }))}
                          style={{
                            flex: 1,
                            padding: '0.625rem 1rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: formData.isFeatured ? '#F59E0B' : '#F3F4F6',
                            color: formData.isFeatured ? 'white' : '#6B7280'
                          }}
                        >
                          <Star size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                          Featured
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, isFeatured: false }))}
                          style={{
                            flex: 1,
                            padding: '0.625rem 1rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: !formData.isFeatured ? '#9CA3AF' : '#F3F4F6',
                            color: !formData.isFeatured ? 'white' : '#6B7280'
                          }}
                        >
                          <Star size={16} style={{ marginRight: '8px', verticalAlign: 'middle', opacity: 0.5 }} />
                          Normal
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Delivery */}
                  <div style={{ background: 'linear-gradient(to bottom right, #F9FAFB, #F3F4F6)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(to bottom right, #0A2463, #3A86FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={20} style={{ color: 'white' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#111827' }}>Pricing & Delivery</p>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Optional metadata</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Price (starting from)</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: 700 }}>$</span>
                          <input
                            type="text"
                            value={formData.pricing || ''}
                            onChange={e => setFormData(f => ({ ...f, pricing: e.target.value }))}
                            placeholder="999"
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: 'white', outline: 'none' }}
                            onFocus={e => { e.target.style.borderColor = '#3A86FF'; e.target.style.boxShadow = '0 0 0 3px rgba(58, 134, 255, 0.1)'; }}
                            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Delivery Time</label>
                        <div style={{ position: 'relative' }}>
                          <Clock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                          <input
                            type="text"
                            value={formData.deliveryTime || ''}
                            onChange={e => setFormData(f => ({ ...f, deliveryTime: e.target.value }))}
                            placeholder="e.g. 2-3 weeks"
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: 'white', outline: 'none' }}
                            onFocus={e => { e.target.style.borderColor = '#3A86FF'; e.target.style.boxShadow = '0 0 0 3px rgba(58, 134, 255, 0.1)'; }}
                            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order */}
                  <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '2px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(to bottom right, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 size={20} style={{ color: 'white' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#111827' }}>Order</p>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Display priority</p>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={e => setFormData(f => ({ ...f, order: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.875rem', background: '#F9FAFB', outline: 'none', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#3A86FF'; e.target.style.boxShadow = '0 0 0 3px rgba(58, 134, 255, 0.1)'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>Lower numbers appear first</p>
                  </div>
                </div>
              )}
            </form>

            {/* Modal footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E5E7EB', background: 'linear-gradient(to right, #F9FAFB, white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {(['basic', 'content', 'steps', 'settings'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      width: activeTab === tab ? '24px' : '8px',
                      height: '8px',
                      borderRadius: activeTab === tab ? '4px' : '50%',
                      background: activeTab === tab ? '#0A2463' : '#D1D5DB',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      padding: 0
                    }}
                  />
                ))}
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: '0.5rem' }}>Step {activeTab === 'basic' ? '1' : activeTab === 'content' ? '2' : activeTab === 'steps' ? '3' : '4'} of 4</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={closeForm} style={{ padding: '0.625rem 1.25rem', border: '1px solid #E5E7EB', borderRadius: '12px', fontWeight: 600, color: '#4B5563', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                  Cancel
                </button>
                {activeTab !== 'settings' && (
                  <button type="button" onClick={() => setActiveTab(activeTab === 'basic' ? 'content' : activeTab === 'content' ? 'steps' : 'settings')} style={{ padding: '0.625rem 1.25rem', background: '#F3F4F6', borderRadius: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none' }}>
                    Continue
                    <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                )}
                <button onClick={handleSubmit} disabled={saving} style={{ padding: '0.625rem 1.5rem', background: 'linear-gradient(to right, #0A2463, #3A86FF)', color: 'white', borderRadius: '12px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.5 : 1 }}>
                  {saving ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255, 255, 255, 0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Saving...
                    </>
                  ) : editing ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}