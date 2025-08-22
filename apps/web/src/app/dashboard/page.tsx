'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { campaignApi, Campaign } from '@/lib/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const data = await campaignApi.list();
      setCampaigns(data);
    } catch (err: any) {
      setError('Kunde inte ladda kampanjer');
      console.error('Error loading campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(amount);
  };

  return (
    <ProtectedRoute>
      <div>
        {/* Navigation */}
        <nav className="navbar" style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)' }}>
          <div className="nav-container">
            <div className="logo">
              <i className="fas fa-hammer"></i>
              <span>AnnonsHjälpen</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'var(--text-medium)', fontSize: '14px' }}>
                {user?.name || user?.email}
              </span>
              <button 
                onClick={logout}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-medium)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
                Logga ut
              </button>
            </div>
          </div>
        </nav>

        <div className="container" style={{ padding: '48px 24px' }}>
          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>
              Dashboard
            </h1>
            <p style={{ color: 'var(--text-medium)', fontSize: '18px' }}>
              Välkommen tillbaka, {user?.name || 'användare'}!
            </p>
          </div>

          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '48px' }}>
            <div className="glass-effect" style={{ padding: '32px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <i className="fas fa-bullhorn" style={{ fontSize: '24px', color: 'var(--primary-orange)', marginRight: '12px' }}></i>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>
                  Aktiva kampanjer
                </h3>
              </div>
              <p style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-orange)', margin: 0 }}>
                {campaigns.filter(c => c.status === 'ACTIVE').length}
              </p>
            </div>

            <div className="glass-effect" style={{ padding: '32px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <i className="fas fa-chart-line" style={{ fontSize: '24px', color: 'var(--primary-orange)', marginRight: '12px' }}></i>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>
                  Total budget
                </h3>
              </div>
              <p style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-orange)', margin: 0 }}>
                {formatCurrency(campaigns.reduce((sum, c) => sum + c.budgetKr, 0))}
              </p>
            </div>

            <div className="glass-effect" style={{ padding: '32px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <i className="fas fa-calendar" style={{ fontSize: '24px', color: 'var(--primary-orange)', marginRight: '12px' }}></i>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>
                  Totala kampanjer
                </h3>
              </div>
              <p style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-orange)', margin: 0 }}>
                {campaigns.length}
              </p>
            </div>
          </div>

          {/* Campaigns Section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>
                Dina kampanjer
              </h2>
              <button className="btn-primary" style={{ padding: '12px 24px' }}>
                <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                Ny kampanj
              </button>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ color: 'var(--text-medium)' }}>Laddar kampanjer...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '16px' }}></i>
                <p style={{ color: 'var(--text-medium)', fontSize: '18px' }}>{error}</p>
                <button onClick={loadCampaigns} className="btn-secondary" style={{ marginTop: '16px' }}>
                  Försök igen
                </button>
              </div>
            ) : campaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <i className="fas fa-bullhorn" style={{ fontSize: '48px', color: 'var(--text-light)', marginBottom: '16px' }}></i>
                <h3 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>
                  Inga kampanjer ännu
                </h3>
                <p style={{ color: 'var(--text-medium)', fontSize: '16px', marginBottom: '24px' }}>
                  Skapa din första kampanj för att komma igång!
                </p>
                <button className="btn-primary">
                  <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                  Skapa första kampanjen
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '24px' }}>
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="glass-effect" style={{ padding: '32px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>
                          {campaign.name}
                        </h3>
                        <p style={{ color: 'var(--text-medium)', fontSize: '14px', margin: 0 }}>
                          <i className="fas fa-map-marker-alt" style={{ marginRight: '6px' }}></i>
                          {campaign.city} (radie: {campaign.radiusKm} km)
                        </p>
                      </div>
                      <span 
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          background: campaign.status === 'ACTIVE' ? '#dcfce7' : campaign.status === 'PAUSED' ? '#fef3c7' : '#f3f4f6',
                          color: campaign.status === 'ACTIVE' ? '#166534' : campaign.status === 'PAUSED' ? '#92400e' : '#6b7280'
                        }}
                      >
                        {campaign.status === 'ACTIVE' ? 'Aktiv' : 
                         campaign.status === 'PAUSED' ? 'Pausad' : 
                         campaign.status === 'DRAFT' ? 'Utkast' : 'Avslutad'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>
                          Budget
                        </p>
                        <p style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>
                          {formatCurrency(campaign.budgetKr)}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>
                          Startdatum
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--text-medium)', margin: 0 }}>
                          {formatDate(campaign.startDate)}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>
                          Slutdatum
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--text-medium)', margin: 0 }}>
                          {formatDate(campaign.endDate)}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '600' }}>
                          Annonser
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--text-medium)', margin: 0 }}>
                          {campaign._count?.ads || 0} st
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                      <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                        <i className="fas fa-chart-bar" style={{ marginRight: '6px' }}></i>
                        Statistik
                      </button>
                      <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                        <i className="fas fa-edit" style={{ marginRight: '6px' }}></i>
                        Redigera
                      </button>
                      {campaign.status === 'ACTIVE' ? (
                        <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                          <i className="fas fa-pause" style={{ marginRight: '6px' }}></i>
                          Pausa
                        </button>
                      ) : (
                        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                          <i className="fas fa-play" style={{ marginRight: '6px' }}></i>
                          Aktivera
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}