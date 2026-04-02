'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  MessageSquare,
  BarChart3,
  Wrench,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  Clock,
  ArrowUpRight,
  Plus,
  Settings,
  Palette,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { analyticsAPI, servicesAPI, projectsAPI, postsAPI, teamAPI, testimonialsAPI, statsAPI } from '@/lib/api';

const statsCards = [
  { label: 'Services', key: 'services', href: '/admin/services', icon: Wrench, color: '#3A86FF', bgColor: '#EBF5FF' },
  { label: 'Projects', key: 'projects', href: '/admin/projects', icon: Briefcase, color: '#E63946', bgColor: '#FCE8E8' },
  { label: 'Blog Posts', key: 'posts', href: '/admin/posts', icon: FileText, color: '#10B981', bgColor: '#E6F6F0' },
  { label: 'Team Members', key: 'team', href: '/admin/team', icon: Users, color: '#F59E0B', bgColor: '#FEF6E7' },
  { label: 'Testimonials', key: 'testimonials', href: '/admin/testimonials', icon: MessageSquare, color: '#8B5CF6', bgColor: '#F3EDFE' },
  { label: 'Stats', key: 'stats', href: '/admin/stats', icon: BarChart3, color: '#0A2463', bgColor: '#E8ECF5' },
];

const quickActions = [
  { label: 'Add Service', href: '/admin/services', icon: Wrench },
  { label: 'Add Project', href: '/admin/projects', icon: Briefcase },
  { label: 'Add Blog Post', href: '/admin/posts', icon: FileText },
  { label: 'Add Team Member', href: '/admin/team', icon: Users },
];

const recentActivity = [
  { type: 'post', title: 'New blog post published', time: '2 hours ago', icon: FileText, color: '#10B981' },
  { type: 'project', title: 'Portfolio project updated', time: '5 hours ago', icon: Briefcase, color: '#E63946' },
  { type: 'team', title: 'New team member added', time: '1 day ago', icon: Users, color: '#F59E0B' },
  { type: 'testimonial', title: 'New testimonial received', time: '2 days ago', icon: MessageSquare, color: '#8B5CF6' },
];

// Format seconds to minutes and seconds
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

// Format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format percentage
const formatPercent = (num: number) => {
  return `${num}%`;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [contentStats, setContentStats] = useState<Record<string, number>>({});
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch content counts in parallel
        const [servicesRes, projectsRes, postsRes, teamRes, testimonialsRes, statsRes, analyticsRes] = await Promise.allSettled([
          servicesAPI.getAll(),
          projectsAPI.getAll(),
          postsAPI.getAll(),
          teamAPI.getAll(),
          testimonialsAPI.getAll(),
          statsAPI.getAll(),
          analyticsAPI.getOverview(30).catch(() => null)
        ]);

        // Set content stats
        const newContentStats: Record<string, number> = {};
        if (servicesRes.status === 'fulfilled') newContentStats.services = servicesRes.value.data.length;
        if (projectsRes.status === 'fulfilled') newContentStats.projects = projectsRes.value.data.length;
        if (postsRes.status === 'fulfilled') newContentStats.posts = postsRes.value.data.length;
        if (teamRes.status === 'fulfilled') newContentStats.team = teamRes.value.data.length;
        if (testimonialsRes.status === 'fulfilled') newContentStats.testimonials = testimonialsRes.value.data.length;
        if (statsRes.status === 'fulfilled') newContentStats.stats = statsRes.value.data.length;

        setContentStats(newContentStats);

        // Set analytics if available
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
          setAnalyticsOverview(analyticsRes.value.data.overview);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load some data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build analytics cards from real data
  const statCards = analyticsOverview ? [
    {
      label: 'Total Views',
      value: formatNumber(analyticsOverview.views),
      change: `${analyticsOverview.viewsChange >= 0 ? '+' : ''}${analyticsOverview.viewsChange}%`,
      trend: analyticsOverview.viewsChange >= 0 ? 'up' : 'down',
      icon: Eye,
      color: '#3A86FF'
    },
    {
      label: 'Total Clicks',
      value: formatNumber(analyticsOverview.clicks),
      change: `${analyticsOverview.clicksChange >= 0 ? '+' : ''}${analyticsOverview.clicksChange}%`,
      trend: analyticsOverview.clicksChange >= 0 ? 'up' : 'down',
      icon: MousePointerClick,
      color: '#10B981'
    },
    {
      label: 'Avg. Session Time',
      value: formatTime(analyticsOverview.avgSessionTime),
      change: `${analyticsOverview.avgSessionTimeChange >= 0 ? '+' : ''}${analyticsOverview.avgSessionTimeChange}%`,
      trend: analyticsOverview.avgSessionTimeChange >= 0 ? 'up' : 'down',
      icon: Clock,
      color: '#F59E0B'
    },
    {
      label: 'Bounce Rate',
      value: formatPercent(analyticsOverview.bounceRate),
      change: `${analyticsOverview.bounceRateChange >= 0 ? '+' : ''}${analyticsOverview.bounceRateChange}%`,
      trend: analyticsOverview.bounceRateChange <= 0 ? 'up' : 'down', // Lower bounce rate is better
      icon: TrendingDown,
      color: '#8B5CF6'
    },
  ] : [
    { label: 'Total Views', value: '-', change: '-', trend: 'up' as const, icon: Eye, color: '#3A86FF' },
    { label: 'Total Clicks', value: '-', change: '-', trend: 'up' as const, icon: MousePointerClick, color: '#10B981' },
    { label: 'Avg. Session Time', value: '-', change: '-', trend: 'up' as const, icon: Clock, color: '#F59E0B' },
    { label: 'Bounce Rate', value: '-', change: '-', trend: 'up' as const, icon: TrendingDown, color: '#8B5CF6' },
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader2 size={32} style={{ color: '#3A86FF', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280' }}>Loading dashboard data...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }} className="page-header">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1c1c1e', marginBottom: '0.5rem' }}>
            Welcome back, {user?.username || 'Admin'}!
          </h2>
          <p style={{ color: '#6B7280' }}>Here's what's happening with your website today.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }} className="header-actions">
          <Link
            href="/admin/hero"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              color: '#374151',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            <Palette size={16} />
            <span className="responsive-hidden-mobile">Edit Hero</span>
            <span className="mobile-only">Hero</span>
          </Link>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          padding: '0.875rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon size={22} style={{ color: stat.color }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: stat.trend === 'up' ? '#10B981' : '#EF4444',
                background: stat.trend === 'up' ? '#ECFDF5' : '#FEF2F2',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px'
              }}>
                {stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.change}
              </div>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{stat.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1c1c1e' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content Management Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1c1c1e', marginBottom: '1rem' }}>
          Content Management
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {statsCards.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = item.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: item.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <item.icon size={26} style={{ color: item.color }} />
                </div>
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1c1c1e', marginBottom: '0.125rem' }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                    {loading ? '...' : contentStats[item.key] || 0} items
                  </p>
                </div>
              </div>
              <ChevronRight size={20} style={{ color: '#9CA3AF' }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Quick Actions */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1c1c1e', marginBottom: '1rem' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0A2463';
                  e.currentTarget.style.borderColor = '#0A2463';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                className="quick-action-btn"
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Plus size={18} style={{ color: 'white' }} />
                </div>
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }} className="quick-action-label">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1c1c1e' }}>
              Recent Activity
            </h3>
            <button style={{
              background: 'none',
              border: 'none',
              color: '#3A86FF',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  paddingBottom: index < recentActivity.length - 1 ? '1rem' : 0,
                  borderBottom: index < recentActivity.length - 1 ? '1px solid #F3F4F6' : 'none'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${activity.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <activity.icon size={18} style={{ color: activity.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1c1c1e', marginBottom: '0.125rem' }}>
                    {activity.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .quick-action-btn {
          background: #F9FAFB !important;
        }
        .quick-action-btn .quick-action-label {
          color: #374151 !important;
        }
        .quick-action-btn:hover {
          background: #0A2463 !important;
        }
        .quick-action-btn:hover .quick-action-label {
          color: white !important;
        }
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}