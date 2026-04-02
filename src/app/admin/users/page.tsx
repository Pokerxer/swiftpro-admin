'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { usersAPI } from '@/lib/api';
import { Plus, Trash2, X, UserCog, Shield, Edit2, Key, Mail, User, Clock } from 'lucide-react';

const BRAND = '#0A2463';

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor';
  createdAt: string;
}

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    color: '#3B82F6',
    bg: '#EFF6FF',
    description: 'Full access — can create, edit, delete all content and manage users',
    icon: Shield,
  },
  editor: {
    label: 'Editor',
    color: '#10B981',
    bg: '#D1FAE5',
    description: 'Can create and edit content, but cannot manage users or delete',
    icon: Edit2,
  },
};

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
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e5e7eb', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'grid', gap: '0.4rem' }}>
            <div style={{ height: 14, width: '35%', background: '#e5e7eb', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 12, width: '55%', background: '#e5e7eb', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
          </div>
          <div style={{ width: 60, height: 24, background: '#e5e7eb', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const avatarColors = [BRAND, '#E63946', '#10B981', '#F59E0B', '#8B5CF6', '#3A86FF'];

export default function UsersPage() {
  const router = useRouter();
  const { isAuthenticated, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'editor' as 'admin' | 'editor' });
  const [showPassword, setShowPassword] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({ username: '', email: '', role: 'editor' as 'admin' | 'editor' });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchUsers();
  }, [isAuthenticated, router]);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setToast({ msg: 'Admin access required to manage users', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersAPI.create(createForm);
      setToast({ msg: `User "${createForm.username}" created`, type: 'success' });
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', password: '', role: 'editor' });
      fetchUsers();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.error || 'Failed to create user', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await usersAPI.update(editTarget._id, editForm);
      setToast({ msg: 'User updated', type: 'success' });
      setEditTarget(null);
      fetchUsers();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.error || 'Failed to update user', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (user: AdminUser, newRole: 'admin' | 'editor') => {
    try {
      await usersAPI.updateRole(user._id, newRole);
      setToast({ msg: `${user.username} is now ${newRole}`, type: 'success' });
      setRoleTarget(null);
      fetchUsers();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.error || 'Failed to change role', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersAPI.delete(deleteTarget._id);
      setToast({ msg: `${deleteTarget.username} removed`, type: 'success' });
      fetchUsers();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.error || 'Failed to delete user', type: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEdit = (u: AdminUser) => {
    setEditTarget(u);
    setEditForm({ username: u.username, email: u.email, role: u.role });
  };

  const inputStyle = { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', width: '100%', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: '0.8rem', fontWeight: 600 as const, color: '#374151', display: 'block' as const, marginBottom: '0.35rem' };

  const isSelf = (u: AdminUser) => currentUser?.id === u._id;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: BRAND }}>Users & Roles</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>{users.length} user{users.length !== 1 ? 's' : ''} — manage access and permissions</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={{ background: BRAND, color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          <Plus size={18} /> Invite User
        </button>
      </div>

      {/* Role legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG.admin][]).map(([key, cfg]) => (
          <div key={key} style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', border: `1px solid ${cfg.bg}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <cfg.icon size={18} color={cfg.color} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: cfg.color, margin: '0 0 2px', fontSize: '0.9rem' }}>{cfg.label}</p>
              <p style={{ color: '#6B7280', fontSize: '0.78rem', margin: 0, lineHeight: 1.4 }}>{cfg.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* User list */}
      {loading ? <Skeleton /> : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {users.length === 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
              <UserCog size={40} style={{ margin: '0 auto 1rem', display: 'block' }} />
              <p style={{ fontWeight: 500 }}>No users found</p>
            </div>
          )}
          {users.map((u, idx) => {
            const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.editor;
            const avatarColor = avatarColors[idx % avatarColors.length];
            const self = isSelf(u);
            return (
              <div key={u._id} style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: self ? `1px solid ${BRAND}20` : '1px solid transparent' }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {initials(u.username)}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 700, color: '#111', margin: 0, fontSize: '0.9rem' }}>{u.username}</p>
                    {self && <span style={{ fontSize: '0.7rem', background: '#EFF6FF', color: '#3B82F6', padding: '1px 8px', borderRadius: '4px', fontWeight: 600 }}>You</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={11} />{u.email}</span>
                    {u.createdAt && <span style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} />Joined {new Date(u.createdAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                {/* Role badge */}
                <button
                  onClick={() => !self && setRoleTarget(u)}
                  title={self ? 'Cannot change your own role' : 'Click to change role'}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '5px 12px', borderRadius: '20px', background: cfg.bg, color: cfg.color, border: 'none', cursor: self ? 'default' : 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  <cfg.icon size={13} />
                  {cfg.label}
                  {!self && <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>▾</span>}
                </button>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEdit(u)} style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', color: '#374151', display: 'flex', alignItems: 'center' }} title="Edit user"><Edit2 size={15} /></button>
                  {!self && (
                    <button onClick={() => setDeleteTarget(u)} style={{ background: '#FEF2F2', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', color: '#E63946', display: 'flex', alignItems: 'center' }} title="Remove user"><Trash2 size={15} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }} onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: '460px', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', margin: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: BRAND, margin: 0 }}>Invite New User</h2>
                <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0' }}>Create a login account for a team member</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Username *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input value={createForm.username} onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))} required placeholder="username" style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} required placeholder="user@company.com" style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input type={showPassword ? 'text' : 'password'} value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} required placeholder="Minimum 6 characters" minLength={6} style={{ ...inputStyle, paddingLeft: '2.25rem', paddingRight: '3.5rem' }} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '0.75rem' }}>{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG.admin][]).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setCreateForm(f => ({ ...f, role: key as 'admin' | 'editor' }))} style={{ padding: '0.875rem', borderRadius: '8px', border: `2px solid ${createForm.role === key ? cfg.color : '#e5e7eb'}`, background: createForm.role === key ? cfg.bg : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                          <cfg.icon size={15} color={cfg.color} />
                          <span style={{ fontWeight: 700, color: cfg.color, fontSize: '0.875rem' }}>{cfg.label}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#6B7280', lineHeight: 1.3 }}>{cfg.description.split(' — ')[0]}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: '#FAFAFA' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'white', border: '1px solid #ddd', padding: '0.625rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#6B7280' : BRAND, color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '6px', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>{saving ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }} onClick={e => e.target === e.currentTarget && setEditTarget(null)}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: '440px', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', margin: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: BRAND, margin: 0 }}>Edit User</h2>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Username</label>
                  <input value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required style={inputStyle} />
                </div>
                {!isSelf(editTarget) && (
                  <div>
                    <label style={labelStyle}>Role</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG.admin][]).map(([key, cfg]) => (
                        <button key={key} type="button" onClick={() => setEditForm(f => ({ ...f, role: key as 'admin' | 'editor' }))} style={{ padding: '0.75rem', borderRadius: '8px', border: `2px solid ${editForm.role === key ? cfg.color : '#e5e7eb'}`, background: editForm.role === key ? cfg.bg : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <cfg.icon size={14} color={cfg.color} />
                            <span style={{ fontWeight: 700, color: cfg.color, fontSize: '0.875rem' }}>{cfg.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: '#FAFAFA' }}>
                <button type="button" onClick={() => setEditTarget(null)} style={{ background: 'white', border: '1px solid #ddd', padding: '0.625rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#6B7280' : BRAND, color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '6px', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role change modal */}
      {roleTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }} onClick={e => e.target === e.currentTarget && setRoleTarget(null)}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: '400px', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', margin: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: BRAND, margin: 0 }}>Change Role</h2>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '2px 0 0' }}>for <strong>{roleTarget.username}</strong></p>
              </div>
              <button onClick={() => setRoleTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gap: '0.75rem' }}>
              {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG.admin][]).map(([key, cfg]) => {
                const current = roleTarget.role === key;
                return (
                  <button key={key} onClick={() => handleRoleChange(roleTarget, key as 'admin' | 'editor')} disabled={current} style={{ padding: '1rem 1.25rem', borderRadius: '10px', border: `2px solid ${current ? cfg.color : '#e5e7eb'}`, background: current ? cfg.bg : 'white', cursor: current ? 'default' : 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.15s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <cfg.icon size={18} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, color: cfg.color, fontSize: '0.9rem' }}>{cfg.label}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280', lineHeight: 1.3 }}>{cfg.description}</p>
                    </div>
                    {current && <span style={{ fontSize: '0.72rem', color: cfg.color, fontWeight: 600, background: cfg.bg, padding: '3px 8px', borderRadius: '4px' }}>Current</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEF2F2', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={22} color="#E63946" /></div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Remove User?</h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}><strong>{deleteTarget.username}</strong> will lose all access to the admin panel.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: 'white', border: '1px solid #ddd', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex: 1, background: '#E63946', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
