'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { postsAPI } from '@/lib/api';
import { Plus, Edit, Trash2, Search, X, Tag, FileText, Eye, EyeOff, Clock, User, Calendar, ChevronUp, ChevronDown } from 'lucide-react';

const BRAND = '#0A2463';

const CATEGORIES = ['Technology', 'Infrastructure', 'Security', 'Cloud', 'Development', 'Business', 'News'];
const catColors: Record<string, string> = {
  Technology: '#3A86FF',
  Infrastructure: '#E63946',
  Security: '#F59E0B',
  Cloud: '#10B981',
  Development: '#8B5CF6',
  Business: '#0A2463',
  News: '#6B7280',
};

interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  image: string;
  published: boolean;
  publishedAt: string;
  category: string;
  readTime: string;
  tags: string[];
}

const empty: Omit<Post, '_id'> = {
  title: '', slug: '', content: '', excerpt: '', author: '',
  image: '', published: false, publishedAt: '',
  category: '', readTime: '', tags: [],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: type === 'success' ? '#10B981' : '#E63946', color: 'white', padding: '0.875rem 1.25rem', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '260px' }}>
      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}><X size={16} /></button>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '8px', background: '#e5e7eb', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'grid', gap: '0.5rem' }}>
            <div style={{ height: 16, width: '60%', background: '#e5e7eb', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 12, width: '40%', background: '#e5e7eb', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 12, width: '30%', background: '#e5e7eb', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}

export default function PostsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [formData, setFormData] = useState<Omit<Post, '_id'>>(empty);
  const [activeTab, setActiveTab] = useState<'meta' | 'content'>('meta');
  const [tagInput, setTagInput] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { if (!isAuthenticated) router.push('/login'); fetchPosts(); }, [isAuthenticated, router]);

  const fetchPosts = async () => {
    try {
      const res = await postsAPI.getAll();
      setPosts(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(empty);
    setSlugManual(false);
    setTagInput('');
    setActiveTab('meta');
    setShowModal(true);
  };

  const openEdit = (post: Post) => {
    setEditing(post);
    setFormData({ ...post });
    setSlugManual(true);
    setTagInput('');
    setActiveTab('meta');
    setShowModal(true);
  };

  const handleTitleChange = (val: string) => {
    setFormData(f => ({ ...f, title: val, slug: slugManual ? f.slug : slugify(val) }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !formData.tags.includes(t)) setFormData(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => setFormData(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...formData, slug: formData.slug || slugify(formData.title) };
    try {
      if (editing) {
        await postsAPI.update(editing._id, data);
        setToast({ msg: 'Post updated successfully', type: 'success' });
      } else {
        await postsAPI.create(data);
        setToast({ msg: 'Post created successfully', type: 'success' });
      }
      setShowModal(false);
      setEditing(null);
      fetchPosts();
    } catch {
      setToast({ msg: 'Failed to save post', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await postsAPI.delete(deleteTarget._id);
      setToast({ msg: 'Post deleted', type: 'success' });
      fetchPosts();
    } catch {
      setToast({ msg: 'Failed to delete post', type: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'published' ? p.published : !p.published);
    return matchSearch && matchStatus;
  });

  const inputStyle = { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', width: '100%', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <main style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: BRAND }}>Blog Posts</h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>{posts.length} post{posts.length !== 1 ? 's' : ''} total</p>
          </div>
          <button onClick={openCreate} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <Plus size={18} /> New Post
          </button>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or author..." style={{ ...inputStyle, paddingLeft: '2.25rem', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['all', 'published', 'draft'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid', borderColor: statusFilter === s ? BRAND : '#ddd', background: statusFilter === s ? BRAND : 'white', color: statusFilter === s ? 'white' : '#374151', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, textTransform: 'capitalize' }}>{s}</button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? <Skeleton /> : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filtered.length === 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                <FileText size={40} style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p style={{ fontWeight: 500 }}>No posts found</p>
              </div>
            )}
            {filtered.map(post => (
              <div key={post._id} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', padding: '1.25rem', transition: 'box-shadow 0.2s' }}>
                {/* Thumbnail */}
                <div style={{ width: 88, height: 72, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {post.image ? <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FileText size={28} style={{ color: '#9CA3AF' }} />}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>{post.title}</h3>
                    {post.category && <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: `${catColors[post.category] || '#6B7280'}20`, color: catColors[post.category] || '#6B7280' }}>{post.category}</span>}
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: post.published ? '#D1FAE5' : '#F3F4F6', color: post.published ? '#059669' : '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {post.published ? <><Eye size={10} /> Published</> : <><EyeOff size={10} /> Draft</>}
                    </span>
                  </div>
                  {post.excerpt && <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0 0 0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.excerpt}</p>}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {post.author && <span style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} />{post.author}</span>}
                    {post.readTime && <span style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} />{post.readTime}</span>}
                    {post.publishedAt && <span style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} />{new Date(post.publishedAt).toLocaleDateString()}</span>}
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {post.tags.map(tag => <span key={tag} style={{ background: '#EFF6FF', color: '#3B82F6', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>{tag}</span>)}
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <button onClick={() => openEdit(post)} style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', color: '#374151', display: 'flex', alignItems: 'center' }}><Edit size={18} /></button>
                  <button onClick={() => setDeleteTarget(post)} style={{ background: '#FEF2F2', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', color: '#E63946', display: 'flex', alignItems: 'center' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', margin: 0 }}>
            {/* Modal header */}
            <div style={{ padding: '1.5rem 1.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: BRAND }}>{editing ? 'Edit Post' : 'New Post'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0.25rem' }}><X size={22} /></button>
              </div>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0' }}>
                {(['meta', 'content'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: activeTab === tab ? BRAND : '#6B7280', borderBottom: `2px solid ${activeTab === tab ? BRAND : 'transparent'}`, textTransform: 'capitalize', transition: 'all 0.15s' }}>{tab === 'meta' ? 'Meta & Settings' : 'Content'}</button>
                ))}
              </div>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: '1.5rem' }}>

                {activeTab === 'meta' && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Title + slug */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Title *</label>
                        <input value={formData.title} onChange={e => handleTitleChange(e.target.value)} required placeholder="Post title" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Slug</span>
                          {!slugManual && <span style={{ fontWeight: 400, color: '#10B981', fontSize: '0.75rem' }}>Auto-generated</span>}
                        </label>
                        <input value={formData.slug} onChange={e => { setSlugManual(true); setFormData(f => ({ ...f, slug: e.target.value })); }} placeholder="post-url-slug" style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.82rem' }} />
                      </div>
                    </div>

                    {/* Author + Category + ReadTime */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Author *</label>
                        <input value={formData.author} onChange={e => setFormData(f => ({ ...f, author: e.target.value }))} required placeholder="Author name" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Category</label>
                        <select value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, background: 'white' }}>
                          <option value="">Select category</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Read Time</label>
                        <input value={formData.readTime} onChange={e => setFormData(f => ({ ...f, readTime: e.target.value }))} placeholder="e.g. 5 min read" style={inputStyle} />
                      </div>
                    </div>

                    {/* Image */}
                    <div>
                      <label style={labelStyle}>Cover Image URL</label>
                      <input value={formData.image} onChange={e => setFormData(f => ({ ...f, image: e.target.value }))} placeholder="https://..." style={inputStyle} />
                      {formData.image && <img src={formData.image} alt="preview" style={{ marginTop: '0.5rem', height: 80, borderRadius: '6px', objectFit: 'cover', border: '1px solid #e5e7eb' }} onError={e => (e.currentTarget.style.display = 'none')} />}
                    </div>

                    {/* Tags */}
                    <div>
                      <label style={labelStyle}>Tags</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Type tag and press Enter" style={{ ...inputStyle, flex: 1 }} />
                        <button type="button" onClick={addTag} style={{ background: BRAND, color: 'white', border: 'none', padding: '0 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={14} /> Add</button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          {formData.tags.map(tag => (
                            <span key={tag} style={{ background: '#EFF6FF', color: '#3B82F6', fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                              {tag}
                              <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: 0, lineHeight: 1 }}><X size={12} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Published toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#F9FAFB', padding: '0.875rem 1rem', borderRadius: '8px' }}>
                      <button type="button" onClick={() => setFormData(f => ({ ...f, published: !f.published }))} style={{ width: 44, height: 24, borderRadius: '12px', border: 'none', background: formData.published ? '#10B981' : '#D1D5DB', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                        <span style={{ position: 'absolute', top: 2, left: formData.published ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#111' }}>{formData.published ? 'Published' : 'Draft'}</p>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B7280' }}>{formData.published ? 'Visible to readers' : 'Hidden from public'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Preview card */}
                    {(formData.title || formData.excerpt) && (
                      <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</p>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          {formData.image && <img src={formData.image} alt="preview" style={{ width: 60, height: 50, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
                          <div>
                            {formData.title && <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>{formData.title}</p>}
                            {formData.excerpt && <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.4 }}>{formData.excerpt}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label style={labelStyle}>Excerpt / Summary</label>
                      <textarea value={formData.excerpt} onChange={e => setFormData(f => ({ ...f, excerpt: e.target.value }))} rows={3} placeholder="Brief description shown in blog listing..." style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Full Content *</label>
                      <textarea value={formData.content} onChange={e => setFormData(f => ({ ...f, content: e.target.value }))} required rows={12} placeholder="Write the full post content here. You can use Markdown formatting." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {activeTab === 'content' && <button type="button" onClick={() => setActiveTab('meta')} style={{ background: 'white', border: '1px solid #ddd', padding: '0.625rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}><ChevronUp size={16} /> Back</button>}
                  {activeTab === 'meta' && <button type="button" onClick={() => setActiveTab('content')} style={{ background: 'white', border: `1px solid ${BRAND}`, color: BRAND, padding: '0.625rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>Content <ChevronDown size={16} /></button>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #ddd', padding: '0.625rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ background: saving ? '#6B7280' : BRAND, color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '6px', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>{saving ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF2F2', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={24} color="#E63946" /></div>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111', marginBottom: '0.5rem' }}>Delete Post?</h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>"{deleteTarget.title}" will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
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
