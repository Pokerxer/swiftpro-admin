'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { heroAPI } from '@/lib/api';
import {
  Plus, Trash2, X, Save, ChevronUp, ChevronDown, Eye, EyeOff,
  Code, Shield, Cloud, Server, Briefcase, Headphones, CheckCircle,
  Zap, Lock, Database, Wifi, Smartphone, Monitor, Settings, Image,
  ExternalLink, BarChart2, Layers, AlertCircle, Edit2,
  Layout, MonitorPlay, Megaphone, BarChart, Sparkles, ArrowRight,
} from 'lucide-react';

const BRAND = '#0A2463';
const ACCENT = '#3A86FF';

const ICON_MAP: Record<string, React.ElementType> = {
  Code, Shield, Cloud, Server, Briefcase, Headphones, CheckCircle,
  Zap, Lock, Database, Wifi, Smartphone, Monitor, Settings, Layers,
  BarChart2, ExternalLink,
};
const ICON_NAMES = Object.keys(ICON_MAP);

interface HeroFeature { icon: string; label: string }
interface HeroStat    { value: string; label: string }
interface HeroSlide {
  _id?: string;
  title: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  backgroundImage: string;
  features: HeroFeature[];
  stats: HeroStat[];
  order: number;
  isActive: boolean;
}

type Tab = 'content' | 'cta' | 'features' | 'stats';

const EMPTY_SLIDE: HeroSlide = {
  title: '', subtitle: '',
  ctaPrimaryText: 'Get a Free Consultation', ctaPrimaryLink: '/contact',
  ctaSecondaryText: 'View Our Services',      ctaSecondaryLink: '/services',
  backgroundImage: '', features: [], stats: [],
  order: 0, isActive: true,
};

function Toast({ msg, type, onClose }: { msg: string; type: 'success'|'error'; onClose: ()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position:'fixed', bottom:'2rem', right:'2rem',
      background: type==='success' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #E63946 0%, #DC2626 100%)',
      color:'white', padding:'1rem 1.5rem', borderRadius:'12px',
      boxShadow:'0 8px 30px rgba(0,0,0,0.25)', zIndex:9999,
      display:'flex', alignItems:'center', gap:'0.75rem', minWidth:'280px',
      animation:'slideIn 0.3s ease'
    }}>
      <span style={{ flex:1, fontSize:'0.95rem', fontWeight:500 }}>{msg}</span>
      <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'white', cursor:'pointer', padding:'4px', borderRadius:'6px' }}><X size={16}/></button>
      <style>{`@keyframes slideIn{from{transform:translateX(100px);opacity:0} to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (v:string)=>void }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'8px' }}>
      {ICON_NAMES.map(name => {
        const Icon = ICON_MAP[name];
        const active = value === name;
        return (
          <button key={name} type="button" onClick={() => onChange(name)} title={name}
            style={{ padding:'10px 6px', borderRadius:'10px', border:`2px solid ${active ? ACCENT : '#E5E7EB'}`, background: active ? `${ACCENT}10` : 'white', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', transition:'all 0.2s', boxShadow: active ? '0 2px 8px rgba(58,134,255,0.2)' : 'none' }}>
            <Icon size={20} color={active ? ACCENT : '#6B7280'} />
            <span style={{ fontSize:'0.6rem', color: active ? ACCENT : '#9CA3AF', fontWeight: active?600:400, lineHeight:1, textAlign:'center' }}>{name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function HeroPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<{ slide: HeroSlide; idx: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg:string; type:'success'|'error' } | null>(null);

  useEffect(() => { if (!isAuthenticated) router.push('/login'); fetchSlides(); }, [isAuthenticated]);

  const fetchSlides = async () => {
    try {
      const res = await heroAPI.get();
      const heroData = res.data;
      const data: HeroSlide[] = heroData.slides?.length > 0 ? heroData.slides : [{ ...EMPTY_SLIDE }];
      setSlides(data.sort((a,b) => a.order - b.order));
    } catch { setSlides([{ ...EMPTY_SLIDE }]); }
    finally { setLoading(false); setDirty(false); }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await heroAPI.update({ slides });
      setToast({ msg: 'Hero slides saved!', type: 'success' });
      setDirty(false);
      fetchSlides();
    } catch { setToast({ msg: 'Failed to save slides', type: 'error' }); }
    finally { setSaving(false); }
  };

  const markDirty = (newSlides: HeroSlide[]) => { setSlides(newSlides); setDirty(true); };

  const openNew = () => {
    setEditing({ slide: { ...EMPTY_SLIDE, order: slides.length }, idx: -1 });
    setActiveTab('content');
  };

  const openEdit = (slide: HeroSlide, idx: number) => {
    setEditing({ slide: { ...slide }, idx });
    setActiveTab('content');
  };

  const applyEdit = () => {
    if (!editing) return;
    const updated = [...slides];
    if (editing.idx === -1) updated.push(editing.slide);
    else updated[editing.idx] = editing.slide;
    updated.forEach((s, i) => (s.order = i));
    markDirty(updated);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (deleteTarget === null) return;
    const updated = slides.filter((_, i) => i !== deleteTarget);
    updated.forEach((s, i) => (s.order = i));
    markDirty(updated);
    setDeleteTarget(null);
  };

  const moveSlide = (from: number, dir: 'up'|'down') => {
    const to = dir === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= slides.length) return;
    const s = [...slides];
    [s[from], s[to]] = [s[to], s[from]];
    s.forEach((x, i) => (x.order = i));
    markDirty(s);
  };

  const toggleActive = (idx: number) => {
    const s = [...slides];
    s[idx] = { ...s[idx], isActive: !s[idx].isActive };
    markDirty(s);
  };

  const upd = (field: keyof HeroSlide, val: any) =>
    setEditing(e => e ? { ...e, slide: { ...e.slide, [field]: val } } : e);

  const addFeature = () => upd('features', [...(editing?.slide.features||[]), { icon:'Code', label:'' }]);
  const updFeature = (i: number, k: 'icon'|'label', v: string) => {
    const f = [...(editing?.slide.features||[])];
    f[i] = { ...f[i], [k]: v };
    upd('features', f);
  };
  const delFeature = (i: number) => upd('features', (editing?.slide.features||[]).filter((_,j)=>j!==i));

  const addStat = () => upd('stats', [...(editing?.slide.stats||[]), { value:'', label:'' }]);
  const updStat = (i: number, k: 'value'|'label', v: string) => {
    const s = [...(editing?.slide.stats||[])];
    s[i] = { ...s[i], [k]: v };
    upd('stats', s);
  };
  const delStat = (i: number) => upd('stats', (editing?.slide.stats||[]).filter((_,j)=>j!==i));

  const inputStyle = { padding:'0.875rem 1rem', border:'1px solid #E5E7EB', borderRadius:'10px', width:'100%', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' as const, background:'#F9FAFB', transition:'all 0.2s' };
  const labelStyle = { fontSize:'0.85rem', fontWeight:600 as const, color:'#374151', display:'block' as const, marginBottom:'0.5rem' };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:400, flexDirection:'column', gap:'1rem' }}>
      <div style={{ width:48, height:48, border:'3px solid #E5E7EB', borderTopColor:BRAND, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>Loading hero slides...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ width:48, height:48, borderRadius:'14px', background:`linear-gradient(135deg, ${BRAND} 0%, ${ACCENT} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(10,36,99,0.25)' }}>
            <Layout size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize:'1.625rem', fontWeight:700, color:BRAND, margin:0 }}>Hero Section</h1>
            <p style={{ color:'#6B7280', fontSize:'0.9rem', marginTop:2 }}>
              {slides.length} slide{slides.length!==1?'s':''} · {slides.filter(s=>s.isActive).length} active
              {dirty && <span style={{ marginLeft:'0.5rem', color:'#F59E0B', fontWeight:600 }}>· Unsaved</span>}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button onClick={openNew} style={{ background:'linear-gradient(135deg, #10B981 0%, #059669 100%)', color:'white', border:'none', padding:'0.75rem 1.25rem', borderRadius:'10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:600, fontSize:'0.9rem', boxShadow:'0 2px 8px rgba(16,185,129,0.3)', transition:'all 0.2s' }}>
            <Plus size={18}/> Add Slide
          </button>
          <button onClick={saveAll} disabled={saving||!dirty} style={{ background: dirty ? `linear-gradient(135deg, ${BRAND} 0%, ${ACCENT} 100%)` : '#9CA3AF', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'10px', cursor: dirty&&!saving?'pointer':'default', display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:600, fontSize:'0.9rem', transition:'all 0.2s', boxShadow: dirty ? '0 2px 8px rgba(10,36,99,0.25)' : 'none' }}>
            <Save size={18}/> {saving ? 'Saving…' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Slide list */}
      {slides.length === 0 ? (
        <div style={{ background:'white', borderRadius:'16px', padding:'4rem 3rem', textAlign:'center', border:'2px dashed #E5E7EB' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:`${BRAND}10`, margin:'0 auto 1.5rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Layers size={32} style={{ display:'block', color:BRAND }} />
          </div>
          <p style={{ color:'#374151', fontWeight:600, fontSize:'1.1rem', marginBottom:'0.5rem' }}>No hero slides yet</p>
          <p style={{ color:'#6B7280', fontSize:'0.9rem', marginBottom:'1.5rem' }}>Create your first hero slide to get started</p>
          <button onClick={openNew} style={{ background:BRAND, color:'white', border:'none', padding:'0.875rem 1.75rem', borderRadius:'10px', cursor:'pointer', fontWeight:600, fontSize:'0.95rem', display:'inline-flex', alignItems:'center', gap:'0.5rem' }}>
            <Plus size={18}/> Add First Slide
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {slides.map((slide, idx) => {
            const previewIcons = slide.features.slice(0,3).map(f => ICON_MAP[f.icon] || Code);
            return (
              <div key={slide._id||idx} style={{ background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', border:`1px solid ${slide.isActive ? '#E5E7EB' : '#F3F4F6'}`, opacity: slide.isActive ? 1 : 0.7, transition:'all 0.2s' }}>
                <div style={{ display:'flex', gap:'1.25rem', padding:'1.25rem', alignItems:'center' }}>
                  {/* Thumbnail */}
                  <div style={{ width:120, height:80, borderRadius:'12px', overflow:'hidden', flexShrink:0, background: slide.backgroundImage ? 'transparent' : `linear-gradient(135deg, ${BRAND} 0%, ${ACCENT} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
                    {slide.backgroundImage
                      ? <img src={slide.backgroundImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>(e.currentTarget.style.display='none')}/>
                      : <MonitorPlay size={28} color="white" />}
                    <div style={{ position:'absolute', inset:0, background:'rgba(10,36,99,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ color:'white', fontWeight:700, fontSize:'0.8rem', textAlign:'center', padding:'0 6px', lineHeight:1.2 }}>Slide {idx+1}</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.35rem', flexWrap:'wrap' }}>
                      <p style={{ fontWeight:700, fontSize:'1rem', color:'#111', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:400 }}>
                        {slide.title || <span style={{ color:'#9CA3AF', fontStyle:'italic' }}>Untitled slide</span>}
                      </p>
                      <span style={{ fontSize:'0.7rem', padding:'4px 10px', borderRadius:'20px', fontWeight:600, background: slide.isActive ? '#D1FAE5' : '#F3F4F6', color: slide.isActive ? '#059669' : '#6B7280' }}>
                        {slide.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {slide.subtitle && <p style={{ color:'#6B7280', fontSize:'0.875rem', margin:'0 0 0.5rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{slide.subtitle}</p>}
                    <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>
                      {slide.features.length>0 && (
                        <span style={{ fontSize:'0.8rem', color:'#9CA3AF', display:'flex', alignItems:'center', gap:'6px' }}>
                          <Sparkles size={14} /> {slide.features.length} feature{slide.features.length!==1?'s':''}
                        </span>
                      )}
                      {slide.stats.length>0 && (
                        <span style={{ fontSize:'0.8rem', color:'#9CA3AF', display:'flex', alignItems:'center', gap:'4px' }}>
                          <BarChart2 size={14}/> {slide.stats.length} stat{slide.stats.length!==1?'s':''}
                        </span>
                      )}
                      {slide.ctaPrimaryText && (
                        <span style={{ fontSize:'0.8rem', color:BRAND, display:'flex', alignItems:'center', gap:'4px' }}>
                          <ArrowRight size={14}/> {slide.ctaPrimaryText}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display:'flex', gap:'8px', flexShrink:0, alignItems:'center' }}>
                    <button onClick={() => toggleActive(idx)} title={slide.isActive ? 'Deactivate' : 'Activate'} style={{ background: slide.isActive ? '#D1FAE5' : '#F3F4F6', border:'none', cursor:'pointer', padding:'8px 12px', borderRadius:'8px', color: slide.isActive ? '#059669' : '#6B7280', display:'flex', alignItems:'center', transition:'all 0.2s' }}>
                      {slide.isActive ? <Eye size={17}/> : <EyeOff size={17}/>}
                    </button>
                    <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                      <button onClick={() => moveSlide(idx,'up')} disabled={idx===0} style={{ background:'none', border:'none', cursor: idx===0?'default':'pointer', padding:'4px', color: idx===0?'#D1D5DB':'#6B7280', display:'flex' }}><ChevronUp size={16}/></button>
                      <button onClick={() => moveSlide(idx,'down')} disabled={idx===slides.length-1} style={{ background:'none', border:'none', cursor: idx===slides.length-1?'default':'pointer', padding:'4px', color: idx===slides.length-1?'#D1D5DB':'#6B7280', display:'flex' }}><ChevronDown size={16}/></button>
                    </div>
                    <button onClick={() => openEdit(slide, idx)} style={{ background:'#EFF6FF', border:'none', cursor:'pointer', padding:'8px 12px', borderRadius:'8px', color:ACCENT, display:'flex', transition:'all 0.2s' }}><Edit2 size={17}/></button>
                    <button onClick={() => setDeleteTarget(idx)} style={{ background:'#FEF2F2', border:'none', cursor:'pointer', padding:'8px 12px', borderRadius:'8px', color:'#E63946', display:'flex', transition:'all 0.2s' }}><Trash2 size={17}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unsaved warning banner */}
      {dirty && (
        <div style={{ marginTop:'1.5rem', background:'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border:'1px solid #FDE68A', borderRadius:'12px', padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:36, height:36, borderRadius:'10px', background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <AlertCircle size={18} color='#D97706'/>
          </div>
          <p style={{ margin:0, fontSize:'0.9rem', color:'#92400E', fontWeight:500 }}>You have unsaved changes. Click <strong>Save All</strong> to publish them.</p>
          <button onClick={saveAll} disabled={saving} style={{ marginLeft:'auto', background:BRAND, color:'white', border:'none', padding:'0.625rem 1.5rem', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'0.875rem' }}>{saving?'Saving…':'Save All'}</button>
        </div>
      )}

      {/* Edit / Create Modal */}
      {editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0' }} onClick={e=>e.target===e.currentTarget&&setEditing(null)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:'900px', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 25px 80px rgba(0,0,0,0.3)', margin:0 }}>

            {/* Header + tabs */}
            <div style={{ padding:'1.5rem 1.75rem 0', borderBottom:'1px solid #E5E7EB', background:'#FAFAFA' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:40, height:40, borderRadius:'10px', background:`linear-gradient(135deg, ${BRAND} 0%, ${ACCENT} 100%)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {editing.idx===-1 ? <Plus size={20} color="white" /> : <Edit2 size={20} color="white" />}
                  </div>
                  <h2 style={{ fontSize:'1.25rem', fontWeight:700, color:BRAND, margin:0 }}>{editing.idx===-1 ? 'New Slide' : `Edit Slide ${editing.idx+1}`}</h2>
                </div>
                <button onClick={() => setEditing(null)} style={{ background:'#F3F4F6', border:'none', cursor:'pointer', padding:'8px', borderRadius:'10px', color:'#6B7280' }}><X size={20}/></button>
              </div>
              <div style={{ display:'flex', gap:'0.25rem' }}>
                {(['content','cta','features','stats'] as Tab[]).map((tab) => (
                  <button key={tab} onClick={()=>setActiveTab(tab)} style={{
                    padding:'0.75rem 1.25rem', border:'none', background: activeTab===tab ? 'white' : 'transparent',
                    cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color: activeTab===tab ? BRAND : '#6B7280',
                    borderBottom:`3px solid ${activeTab===tab ? ACCENT : 'transparent'}`,
                    transition:'all 0.2s', display:'flex', alignItems:'center', gap:8,
                    borderRadius:'10px 10px 0 0', boxShadow: activeTab===tab ? '0 -2px 10px rgba(0,0,0,0.05)' : 'none'
                  }}>
                    {tab === 'content' && <Layout size={16} />}
                    {tab === 'cta' && <Megaphone size={16} />}
                    {tab === 'features' && <Sparkles size={16} />}
                    {tab === 'stats' && <BarChart size={16} />}
                    {tab==='cta' ? 'CTA Buttons' : tab.charAt(0).toUpperCase()+tab.slice(1)}
                    {tab==='features' && editing.slide.features.length>0 && <span style={{ background:ACCENT, color:'white', borderRadius:'10px', padding:'2px 8px', fontSize:'0.7rem' }}>{editing.slide.features.length}</span>}
                    {tab==='stats' && editing.slide.stats.length>0 && <span style={{ background:ACCENT, color:'white', borderRadius:'10px', padding:'2px 8px', fontSize:'0.7rem' }}>{editing.slide.stats.length}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Body: form + live preview */}
            <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

              {/* Form */}
              <div style={{ flex:1, overflowY:'auto', padding:'1.75rem' }}>

                {activeTab==='content' && (
                  <div style={{ display:'grid', gap:'1.25rem' }}>
                    <div>
                      <label style={labelStyle}>Title *</label>
                      <input value={editing.slide.title} onChange={e=>upd('title',e.target.value)} placeholder="e.g. Empowering Businesses with" style={inputStyle} onFocus={(e) => { e.target.style.borderColor=ACCENT; e.target.style.background='white'; e.target.style.boxShadow='0 0 0 3px rgba(58,134,255,0.1)'; }} onBlur={(e) => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; e.target.style.boxShadow='none'; }}/>
                      <p style={{ fontSize:'0.75rem', color:'#9CA3AF', marginTop:'0.35rem' }}>The main heading text shown at the top of the hero.</p>
                    </div>
                    <div>
                      <label style={labelStyle}>Subtitle / Highlight *</label>
                      <input value={editing.slide.subtitle} onChange={e=>upd('subtitle',e.target.value)} placeholder="e.g. Innovative ICT Solutions in Nigeria" style={inputStyle} onFocus={(e) => { e.target.style.borderColor=ACCENT; e.target.style.background='white'; e.target.style.boxShadow='0 0 0 3px rgba(58,134,255,0.1)'; }} onBlur={(e) => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; e.target.style.boxShadow='none'; }}/>
                    </div>
                    <div>
                      <label style={labelStyle}>Background Image URL</label>
                      <input value={editing.slide.backgroundImage} onChange={e=>upd('backgroundImage',e.target.value)} placeholder="https://..." style={inputStyle} onFocus={(e) => { e.target.style.borderColor=ACCENT; e.target.style.background='white'; e.target.style.boxShadow='0 0 0 3px rgba(58,134,255,0.1)'; }} onBlur={(e) => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; e.target.style.boxShadow='none'; }}/>
                      {editing.slide.backgroundImage && (
                        <img src={editing.slide.backgroundImage} alt="bg" style={{ marginTop:'0.75rem', width:'100%', height:100, objectFit:'cover', borderRadius:'10px', border:'1px solid #E5E7EB' }} onError={e=>(e.currentTarget.style.display='none')}/>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'1rem', background:'#F9FAFB', padding:'1rem 1.25rem', borderRadius:'12px', border:'1px solid #E5E7EB' }}>
                      <button type="button" onClick={() => upd('isActive', !editing.slide.isActive)} style={{ width:48, height:26, borderRadius:'13px', border:'none', background: editing.slide.isActive ? '#10B981' : '#D1D5DB', cursor:'pointer', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                        <span style={{ position:'absolute', top:3, left: editing.slide.isActive ? 23 : 3, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                      </button>
                      <div>
                        <p style={{ margin:0, fontWeight:600, fontSize:'0.9rem', color:'#111' }}>{editing.slide.isActive ? 'Active' : 'Inactive'}</p>
                        <p style={{ margin:0, fontSize:'0.8rem', color:'#6B7280' }}>{editing.slide.isActive ? 'Visible on the website' : 'Hidden from visitors'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab==='cta' && (
                  <div style={{ display:'grid', gap:'1.5rem' }}>
                    {[['ctaPrimaryText','ctaPrimaryLink','Primary Button', BRAND],['ctaSecondaryText','ctaSecondaryLink','Secondary Button', 'transparent']].map(([textKey, linkKey, label, bg]) => (
                      <div key={textKey as string} style={{ background:'#F9FAFB', borderRadius:'14px', padding:'1.25rem', border:'1px solid #E5E7EB' }}>
                        <p style={{ fontWeight:700, fontSize:'0.9rem', color: bg===BRAND?BRAND:'#374151', margin:'0 0 1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          {label === 'Primary Button' ? <Megaphone size={16} /> : <ArrowRight size={16} />}
                          {label as string}
                        </p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                          <div>
                            <label style={labelStyle}>Button Text</label>
                            <input value={(editing.slide as any)[textKey as string]} onChange={e=>upd(textKey as keyof HeroSlide, e.target.value)} placeholder="Get a Free Consultation" style={inputStyle} onFocus={(e) => { e.target.style.borderColor=ACCENT; e.target.style.background='white'; }} onBlur={(e) => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; }}/>
                          </div>
                          <div>
                            <label style={labelStyle}>Link / URL</label>
                            <input value={(editing.slide as any)[linkKey as string]} onChange={e=>upd(linkKey as keyof HeroSlide, e.target.value)} placeholder="/contact" style={inputStyle} onFocus={(e) => { e.target.style.borderColor=ACCENT; e.target.style.background='white'; }} onBlur={(e) => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; }}/>
                          </div>
                        </div>
                        <div style={{ marginTop:'1rem', display:'flex', gap:'0.75rem', alignItems:'center' }}>
                          <div style={{ background: bg as string, color: bg===BRAND?'white':BRAND, padding:'10px 20px', borderRadius:'8px', fontSize:'0.85rem', fontWeight:600, border: bg===BRAND?'none':`2px solid ${BRAND}` }}>{(editing.slide as any)[textKey as string] || 'Button'}</div>
                          <span style={{ fontSize:'0.8rem', color:'#9CA3AF' }}>Preview</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab==='features' && (
                  <div>
                    {editing.slide.features.map((f,i) => (
                      <div key={i} style={{ background:'#F9FAFB', borderRadius:'12px', padding:'1.25rem', marginBottom:'1rem', border:'1px solid #E5E7EB' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                          <p style={{ fontWeight:600, fontSize:'0.875rem', color:'#374151', margin:0, display:'flex', alignItems:'center', gap:'0.5rem' }}>
                            <span style={{ width:24, height:24, borderRadius:'6px', background:BRAND, color:'white', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</span>
                            Feature {i+1}
                          </p>
                          <button type="button" onClick={() => delFeature(i)} style={{ background:'#FEF2F2', border:'none', cursor:'pointer', padding:'6px 10px', borderRadius:'8px', color:'#E63946', display:'flex', alignItems:'center' }}><X size={16}/></button>
                        </div>
                        <div style={{ marginBottom:'1rem' }}>
                          <label style={labelStyle}>Label</label>
                          <input value={f.label} onChange={e=>updFeature(i,'label',e.target.value)} placeholder="e.g. Custom Software" style={inputStyle} onFocus={(e) => { e.target.style.borderColor=ACCENT; e.target.style.background='white'; }} onBlur={(e) => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; }}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Icon</label>
                          <IconPicker value={f.icon} onChange={v=>updFeature(i,'icon',v)}/>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addFeature} style={{ width:'100%', padding:'1rem', border:`2px dashed #CBD5E1`, borderRadius:'12px', background:'white', cursor:'pointer', color:'#64748B', fontWeight:600, fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'all 0.2s' }}>
                      <Plus size={18}/> Add Feature
                    </button>
                  </div>
                )}

                {activeTab==='stats' && (
                  <div>
                    {editing.slide.stats.map((s,i) => (
                      <div key={i} style={{ display:'flex', gap:'1rem', marginBottom:'1rem', alignItems:'flex-end', background:'#F9FAFB', padding:'1.25rem', borderRadius:'12px', border:'1px solid #E5E7EB' }}>
                        <div style={{ width:120 }}>
                          {i===0 && <label style={labelStyle}>Value</label>}
                          <input value={s.value} onChange={e=>updStat(i,'value',e.target.value)} placeholder="200+" style={inputStyle} onFocus={(e) => { e.target.style.borderColor=ACCENT; e.target.style.background='white'; }} onBlur={(e) => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; }}/>
                        </div>
                        <div style={{ flex:1 }}>
                          {i===0 && <label style={labelStyle}>Label</label>}
                          <input value={s.label} onChange={e=>updStat(i,'label',e.target.value)} placeholder="Clients" style={inputStyle} onFocus={(e) => { e.target.style.borderColor=ACCENT; e.target.style.background='white'; }} onBlur={(e) => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; }}/>
                        </div>
                        <button type="button" onClick={()=>delStat(i)} style={{ background:'#FEF2F2', border:'none', cursor:'pointer', padding:'12px', borderRadius:'10px', color:'#E63946', display:'flex', marginBottom:1 }}><X size={18}/></button>
                      </div>
                    ))}
                    <button type="button" onClick={addStat} style={{ width:'100%', padding:'1rem', border:`2px dashed #CBD5E1`, borderRadius:'12px', background:'white', cursor:'pointer', color:'#64748B', fontWeight:600, fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
                      <Plus size={18}/> Add Stat
                    </button>
                  </div>
                )}
              </div>

              {/* Live preview panel */}
              <div style={{ width:300, borderLeft:'1px solid #E5E7EB', background:'linear-gradient(180deg, #F9FAFB 0%, #F3F4F6 100%)', padding:'1.5rem', overflowY:'auto', flexShrink:0 }}>
                <p style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <Monitor size={14}/> Live Preview
                </p>
                <div style={{ borderRadius:'14px', overflow:'hidden', boxShadow:'0 4px 20px rgba(10,36,99,0.15)', marginBottom:'1rem' }}>
                  <div style={{ background: editing.slide.backgroundImage ? 'transparent' : `linear-gradient(135deg, ${BRAND} 0%, ${ACCENT} 100%)`, backgroundImage: editing.slide.backgroundImage ? `url(${editing.slide.backgroundImage})` : undefined, backgroundSize:'cover', backgroundPosition:'center', padding:'1.5rem', position:'relative', minHeight:140 }}>
                    {editing.slide.backgroundImage && <div style={{ position:'absolute', inset:0, background:'rgba(10,36,99,0.55)' }}/>}
                    <div style={{ position:'relative', zIndex:1 }}>
                      <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'0.75rem', margin:'0 0 6px', lineHeight:1.3 }}>{editing.slide.title||'Title'}</p>
                      <p style={{ color:'#60A5FA', fontSize:'0.95rem', fontWeight:700, margin:'0 0 10px', lineHeight:1.3 }}>{editing.slide.subtitle||'Subtitle'}</p>
                      {(editing.slide.ctaPrimaryText||editing.slide.ctaSecondaryText) && (
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                          {editing.slide.ctaPrimaryText && <span style={{ background:'white', color:BRAND, fontSize:'0.65rem', fontWeight:700, padding:'4px 10px', borderRadius:'6px' }}>{editing.slide.ctaPrimaryText}</span>}
                          {editing.slide.ctaSecondaryText && <span style={{ border:'1px solid rgba(255,255,255,0.5)', color:'white', fontSize:'0.65rem', fontWeight:600, padding:'4px 10px', borderRadius:'6px' }}>{editing.slide.ctaSecondaryText}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  {editing.slide.features.length>0 && (
                    <div style={{ background:'white', padding:'0.875rem', display:'flex', gap:'8px', flexWrap:'wrap' }}>
                      {editing.slide.features.map((f,i) => {
                        const Icon = ICON_MAP[f.icon]||Code;
                        return <span key={i} style={{ display:'flex', alignItems:'center', gap:'4px', background:ACCENT, color:'white', fontSize:'0.7rem', fontWeight:600, padding:'4px 10px', borderRadius:'20px' }}><Icon size={12}/>{f.label||'Feature'}</span>;
                      })}
                    </div>
                  )}
                  {editing.slide.stats.length>0 && (
                    <div style={{ background:'#F9FAFB', padding:'0.875rem', display:'flex', gap:'16px', flexWrap:'wrap', borderTop:'1px solid #E5E7EB' }}>
                      {editing.slide.stats.map((s,i) => (
                        <div key={i} style={{ textAlign:'center' }}>
                          <p style={{ fontWeight:800, fontSize:'0.95rem', color:BRAND, margin:0 }}>{s.value||'0'}</p>
                          <p style={{ fontSize:'0.65rem', color:'#6B7280', margin:0 }}>{s.label||'Label'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p style={{ fontSize:'0.72rem', color:'#9CA3AF', lineHeight:1.5, textAlign:'center' }}>Preview is approximate. Actual design depends on your theme settings.</p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding:'1.25rem 1.75rem', borderTop:'1px solid #E5E7EB', display:'flex', justifyContent:'flex-end', gap:'0.75rem', background:'#FAFAFA' }}>
              <button onClick={() => setEditing(null)} style={{ background:'white', border:'1px solid #E5E7EB', padding:'0.75rem 1.5rem', borderRadius:'10px', cursor:'pointer', fontSize:'0.9rem', fontWeight:500, color:'#374151' }}>Cancel</button>
              <button onClick={applyEdit} style={{ background:`linear-gradient(135deg, ${BRAND} 0%, ${ACCENT} 100%)`, color:'white', border:'none', padding:'0.75rem 1.75rem', borderRadius:'10px', cursor:'pointer', fontSize:'0.9rem', fontWeight:600, boxShadow:'0 2px 10px rgba(10,36,99,0.25)' }}>
                {editing.idx===-1 ? 'Add Slide' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'white', borderRadius:'20px', padding:'2.5rem', maxWidth:'400px', width:'100%', textAlign:'center', boxShadow:'0 25px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', margin:'0 auto 1.25rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 15px rgba(239,68,68,0.2)' }}>
              <Trash2 size={28} color="#E63946"/>
            </div>
            <h3 style={{ fontWeight:700, fontSize:'1.25rem', marginBottom:'0.5rem', color:'#111' }}>Delete Slide?</h3>
            <p style={{ color:'#6B7280', marginBottom:'2rem', fontSize:'0.95rem', lineHeight:1.5 }}>Are you sure you want to delete <strong>"{slides[deleteTarget]?.title || 'this slide'}"</strong>? This action cannot be undone.</p>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex:1, background:'white', border:'1px solid #E5E7EB', padding:'0.875rem', borderRadius:'10px', cursor:'pointer', fontWeight:600, fontSize:'0.9rem', color:'#374151' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex:1, background:'linear-gradient(135deg, #E63946 0%, #DC2626 100%)', color:'white', border:'none', padding:'0.875rem', borderRadius:'10px', cursor:'pointer', fontWeight:600, fontSize:'0.9rem', boxShadow:'0 2px 10px rgba(239,68,68,0.3)' }}>Delete Slide</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  );
}
