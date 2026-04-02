'use client';

import { useEffect, useState } from 'react';
import { projectsAPI } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Grid, List, X, Check, AlertCircle, Star, ExternalLink, Github, Briefcase } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  slug: string;
  description: string;
  fullDescription: string;
  category: string;
  image: string;
  tags: string[];
  technologies: string[];
  client: string;
  year: string;
  liveUrl: string;
  repoUrl: string;
  featured: boolean;
  order: number;
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  fullDescription: string;
  category: string;
  image: string;
  tags: string[];
  technologies: string[];
  client: string;
  year: string;
  liveUrl: string;
  repoUrl: string;
  featured: boolean;
  order: number;
}

const CATEGORIES = ['Web', 'Infrastructure', 'Software', 'Security'];
const BRAND = '#0A2463';
const BRAND_LIGHT = '#e8edf7';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.875rem',
  border: '1.5px solid #e0e0e0', borderRadius: '8px',
  fontSize: '0.9rem', outline: 'none', background: '#fff',
};
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.4rem', fontWeight: '600',
  fontSize: '0.78rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em',
};

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyForm: FormData = {
  title: '', slug: '', description: '', fullDescription: '',
  category: 'Web', image: '', tags: [], technologies: [],
  client: '', year: new Date().getFullYear().toString(),
  liveUrl: '', repoUrl: '', featured: false, order: 0,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'links' | 'content'>('info');
  const [editing, setEditing] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [formData, setFormData] = useState<FormData>(emptyForm);

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }
  }, [toast]);
  useEffect(() => {
    if (!slugManual && formData.title) setFormData(f => ({ ...f, slug: slugify(f.title) }));
  }, [formData.title, slugManual]);

  const fetchProjects = async () => {
    setLoading(true);
    try { const res = await projectsAPI.getAll(); setProjects(res.data); }
    catch { showToast('Failed to load projects', 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const openCreate = () => {
    setEditing(null); setFormData(emptyForm); setSlugManual(false);
    setTagInput(''); setTechInput(''); setActiveTab('info'); setShowForm(true);
  };
  const openEdit = (p: Project) => {
    setEditing(p);
    setFormData({
      title: p.title, slug: p.slug || slugify(p.title),
      description: p.description || '', fullDescription: p.fullDescription || '',
      category: p.category || 'Web', image: p.image || '',
      tags: p.tags || [], technologies: p.technologies || [],
      client: p.client || '', year: p.year || '',
      liveUrl: p.liveUrl || '', repoUrl: p.repoUrl || '',
      featured: p.featured || false, order: p.order || 0,
    });
    setSlugManual(true); setTagInput(''); setTechInput('');
    setActiveTab('info'); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !formData.tags.includes(v)) setFormData(f => ({ ...f, tags: [...f.tags, v] }));
    setTagInput('');
  };
  const removeTag = (t: string) => setFormData(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));
  const addTech = () => {
    const v = techInput.trim();
    if (v && !formData.technologies.includes(v)) setFormData(f => ({ ...f, technologies: [...f.technologies, v] }));
    setTechInput('');
  };
  const removeTech = (t: string) => setFormData(f => ({ ...f, technologies: f.technologies.filter(x => x !== t) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await projectsAPI.update(editing._id, formData); showToast('Project updated', 'success'); }
      else { await projectsAPI.create(formData); showToast('Project created', 'success'); }
      closeForm(); fetchProjects();
    } catch { showToast('Failed to save project', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await projectsAPI.delete(id); showToast('Project deleted', 'success'); setDeleteConfirm(null); fetchProjects(); }
    catch { showToast('Failed to delete project', 'error'); }
  };

  const filtered = projects.filter(p =>
    (p.title.toLowerCase().includes(search.toLowerCase()) || (p.client || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || p.category === filterCat)
  );

  const catColors: Record<string, string> = { Web: '#3A86FF', Infrastructure: '#E63946', Software: '#10B981', Security: '#F59E0B' };

  if (loading) return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ height: '32px', width: '160px', background: '#eee', borderRadius: '8px' }} />
        <div style={{ height: '36px', width: '120px', background: '#eee', borderRadius: '8px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e5e5' }}>
            <div style={{ height: '160px', background: '#eee' }} />
            <div style={{ padding: '1.25rem' }}>
              <div style={{ height: '18px', background: '#eee', borderRadius: '4px', marginBottom: '0.5rem', width: '65%' }} />
              <div style={{ height: '13px', background: '#eee', borderRadius: '4px', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}div[style*="background: #eee"]{animation:pulse 1.5s ease infinite}`}</style>
    </div>
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: toast.type === 'success' ? '#10B981' : '#E63946', color: 'white', padding: '0.875rem 1.25rem', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.625rem', zIndex: 2000, fontSize: '0.9rem', fontWeight: '500' }}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />} {toast.message}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: '#fee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 size={24} color="#E63946" />
            </div>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Delete Project?</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '0.7rem 1.5rem', border: '1.5px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: '8px', background: '#E63946', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1c1c1e' }}>Projects</h2>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '2px' }}>{filtered.length} of {projects.length} projects</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '0.875rem', width: '200px', outline: 'none' }} />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '0.6rem 0.75rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', background: 'white', cursor: 'pointer' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {(['grid', 'list'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ background: viewMode === m ? 'white' : 'transparent', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', boxShadow: viewMode === m ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', color: viewMode === m ? '#1c1c1e' : '#999' }}>
                {m === 'grid' ? <Grid size={16} /> : <List size={16} />}
              </button>
            ))}
          </div>
          <button onClick={openCreate} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', fontSize: '0.875rem' }}>
            <Plus size={17} /> Add Project
          </button>
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div style={{ background: 'white', padding: '5rem 2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e5e5' }}>
          <div style={{ width: '72px', height: '72px', background: BRAND_LIGHT, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Briefcase size={36} color={BRAND} />
          </div>
          <h3 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#1c1c1e' }}>{search || filterCat ? 'No projects match' : 'No projects yet'}</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{search || filterCat ? 'Try adjusting your filters.' : 'Add your first project to get started.'}</p>
          {!search && !filterCat && <button onClick={openCreate} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Add Project</button>}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(p => (
            <div key={p._id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e8e8', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ height: '160px', background: p.image ? `url(${p.image}) center/cover` : '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {!p.image && <Briefcase size={40} color="#c5d0e8" />}
                <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                  <span style={{ background: catColors[p.category] || BRAND, color: 'white', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>{p.category}</span>
                  {p.featured && <span style={{ background: '#F59E0B', color: 'white', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Star size={10} fill="white" /> Featured</span>}
                </div>
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.3rem' }}>
                  <button onClick={() => openEdit(p)} style={{ background: 'white', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '7px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', display: 'flex' }}><Edit size={14} /></button>
                  <button onClick={() => setDeleteConfirm(p._id)} style={{ background: 'white', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '7px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', color: '#E63946', display: 'flex' }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ padding: '1.1rem 1.25rem' }}>
                <h3 style={{ fontWeight: '700', fontSize: '0.97rem', color: '#1c1c1e', marginBottom: '0.25rem' }}>{p.title}</h3>
                {p.slug && <p style={{ fontSize: '0.73rem', color: '#bbb', fontFamily: 'monospace', marginBottom: '0.4rem' }}>/{p.slug}</p>}
                <p style={{ color: '#666', fontSize: '0.82rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>{(p.description || '').slice(0, 90)}{(p.description || '').length > 90 ? '…' : ''}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {(p.tags || []).slice(0, 4).map(t => <span key={t} style={{ fontSize: '0.72rem', background: '#f5f5f5', color: '#555', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{t}</span>)}
                  {(p.tags || []).length > 4 && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>+{p.tags.length - 4}</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {p.client && <span style={{ fontSize: '0.75rem', color: '#888' }}>{p.client}</span>}
                  {p.year && <span style={{ fontSize: '0.75rem', color: '#bbb' }}>· {p.year}</span>}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                    {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#888', display: 'flex' }}><ExternalLink size={14} /></a>}
                    {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#888', display: 'flex' }}><Github size={14} /></a>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length > 0 && viewMode === 'list' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f8f8' }}>
                {['Project', 'Category', 'Client', 'Year', 'Tags', ''].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: h === '' ? 'right' : 'left', fontWeight: '600', fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1.5px solid #efefef' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p._id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f2f2f2' : 'none' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: p.image ? `url(${p.image}) center/cover` : '#f0f4ff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {!p.image && <Briefcase size={18} color="#c5d0e8" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1c1c1e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {p.title} {p.featured && <Star size={13} color="#F59E0B" fill="#F59E0B" />}
                        </div>
                        {p.slug && <div style={{ fontSize: '0.73rem', color: '#bbb', fontFamily: 'monospace' }}>/{p.slug}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ background: catColors[p.category] || BRAND, color: 'white', fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#666', fontSize: '0.85rem' }}>{p.client || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#888', fontSize: '0.85rem' }}>{p.year || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {(p.tags || []).slice(0, 3).map(t => <span key={t} style={{ fontSize: '0.72rem', background: '#f5f5f5', color: '#555', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{t}</span>)}
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <button onClick={() => openEdit(p)} style={{ background: 'transparent', border: '1.5px solid #e0e0e0', cursor: 'pointer', padding: '0.4rem 0.7rem', borderRadius: '7px', marginRight: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: '500' }}><Edit size={14} /> Edit</button>
                    <button onClick={() => setDeleteConfirm(p._id)} style={{ background: 'transparent', border: '1.5px solid #fecdd3', cursor: 'pointer', padding: '0.4rem 0.7rem', borderRadius: '7px', color: '#E63946', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: '500' }}><Trash2 size={14} /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, padding: '0' }} onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div style={{ background: 'white', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', margin: 0 }}>
            <div style={{ padding: '1.4rem 1.75rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontWeight: '700', fontSize: '1.15rem', color: '#1c1c1e' }}>{editing ? 'Edit Project' : 'New Project'}</h3>
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '2px' }}>{editing ? `Editing "${editing.title}"` : 'Fill in the project details'}</p>
              </div>
              <button onClick={closeForm} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', color: '#555' }}><X size={20} /></button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 1.75rem', flexShrink: 0 }}>
              {(['info', 'links', 'content'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'transparent', border: 'none', borderBottom: activeTab === tab ? `2.5px solid ${BRAND}` : '2.5px solid transparent', padding: '0.875rem 1rem', cursor: 'pointer', fontWeight: activeTab === tab ? '700' : '500', fontSize: '0.875rem', color: activeTab === tab ? BRAND : '#888', marginBottom: '-1px', textTransform: 'capitalize' }}>
                  {tab === 'info' ? 'Basic Info' : tab === 'links' ? 'Links & Tags' : 'Description'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                {activeTab === 'info' && (<>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Title <span style={{ color: '#E63946' }}>*</span></label>
                      <input required value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Company Website Redesign" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Slug <span style={{ color: '#E63946' }}>*</span></span>
                        <span style={{ fontWeight: '400', fontSize: '0.72rem', color: '#aaa', textTransform: 'none', letterSpacing: 0 }}>{slugManual ? 'manual' : 'auto'}</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }}>/</span>
                        <input required value={formData.slug} onChange={e => { setSlugManual(true); setFormData(f => ({ ...f, slug: slugify(e.target.value) })); }} style={{ ...inputStyle, paddingLeft: '1.4rem' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Category <span style={{ color: '#E63946' }}>*</span></label>
                      <select required value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Year</label>
                      <input value={formData.year} onChange={e => setFormData(f => ({ ...f, year: e.target.value }))} placeholder="2024" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Client</label>
                      <input value={formData.client} onChange={e => setFormData(f => ({ ...f, client: e.target.value }))} placeholder="Client name" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Display Order</label>
                      <input type="number" value={formData.order} onChange={e => setFormData(f => ({ ...f, order: Number(e.target.value) }))} style={{ ...inputStyle, width: 'auto' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8f9fc', borderRadius: '10px', border: '1.5px solid #ebebf5', cursor: 'pointer' }} onClick={() => setFormData(f => ({ ...f, featured: !f.featured }))}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: `2px solid ${formData.featured ? BRAND : '#ccc'}`, background: formData.featured ? BRAND : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {formData.featured && <Check size={13} color="white" strokeWidth={3} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Featured Project</div>
                      <div style={{ fontSize: '0.78rem', color: '#aaa' }}>Show this project prominently on the portfolio</div>
                    </div>
                    {formData.featured && <Star size={16} color="#F59E0B" fill="#F59E0B" style={{ marginLeft: 'auto' }} />}
                  </div>
                </>)}

                {activeTab === 'links' && (<>
                  <div>
                    <label style={labelStyle}>Image URL</label>
                    <input value={formData.image} onChange={e => setFormData(f => ({ ...f, image: e.target.value }))} placeholder="https://…" style={inputStyle} />
                    {formData.image && <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', height: '120px', background: `url(${formData.image}) center/cover`, border: '1px solid #eee' }} />}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Live URL</label>
                      <input value={formData.liveUrl} onChange={e => setFormData(f => ({ ...f, liveUrl: e.target.value }))} placeholder="https://…" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Repo URL</label>
                      <input value={formData.repoUrl} onChange={e => setFormData(f => ({ ...f, repoUrl: e.target.value }))} placeholder="https://github.com/…" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Tags</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add tag and press Enter" style={{ ...inputStyle }} />
                      <button type="button" onClick={addTag} style={{ background: BRAND_LIGHT, border: 'none', color: BRAND, padding: '0 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>+ Add</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {formData.tags.map(t => <span key={t} style={{ background: '#f0f4ff', color: BRAND, fontSize: '0.82rem', padding: '0.3rem 0.7rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>{t}<button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 0 }}><X size={13} /></button></span>)}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Technologies</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }} placeholder="e.g. React, Node.js" style={{ ...inputStyle }} />
                      <button type="button" onClick={addTech} style={{ background: BRAND_LIGHT, border: 'none', color: BRAND, padding: '0 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>+ Add</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {formData.technologies.map(t => <span key={t} style={{ background: '#f0fff4', color: '#065f46', fontSize: '0.82rem', padding: '0.3rem 0.7rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>{t}<button type="button" onClick={() => removeTech(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 0 }}><X size={13} /></button></span>)}
                    </div>
                  </div>
                </>)}

                {activeTab === 'content' && (<>
                  <div>
                    <label style={labelStyle}>Short Description <span style={{ color: '#E63946' }}>*</span></label>
                    <textarea required value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Brief overview shown on the portfolio card…" style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Full Description</label>
                    <textarea value={formData.fullDescription} onChange={e => setFormData(f => ({ ...f, fullDescription: e.target.value }))} rows={6} placeholder="Detailed description for the project detail page…" style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                </>)}
              </div>

              <div style={{ padding: '1.1rem 1.75rem', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#fafafa' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['info', 'links', 'content'] as const).map(tab => (
                    <div key={tab} onClick={() => setActiveTab(tab)} style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTab === tab ? BRAND : '#ddd', cursor: 'pointer' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button type="button" onClick={closeForm} style={{ padding: '0.7rem 1.25rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem' }}>Cancel</button>
                  {activeTab !== 'content' && <button type="button" onClick={() => setActiveTab(activeTab === 'info' ? 'links' : 'content')} style={{ padding: '0.7rem 1.25rem', border: 'none', borderRadius: '8px', background: '#f0f0f0', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>Next →</button>}
                  <button type="submit" disabled={saving} style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: '8px', background: saving ? '#a0b0d0' : BRAND, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                    {saving ? 'Saving…' : editing ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
