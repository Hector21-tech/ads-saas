'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { campaignApi } from '@/lib/api';

interface CampaignFormData {
  name: string;
  city: string;
  radiusKm: number;
  budgetKr: number;
  startDate: string;
  endDate: string;
}

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CampaignModal({ isOpen, onClose, onSuccess }: CampaignModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CampaignFormData>();

  const onSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      await campaignApi.create({
        ...data,
        radiusKm: Number(data.radiusKm),
        budgetKr: Number(data.budgetKr),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunde inte skapa kampanj');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className="modal-content"
        style={{
          background: 'var(--bg-white)',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-strong)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>
            Skapa ny kampanj
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--text-medium)',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              marginBottom: '24px', 
              fontSize: '14px' 
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: 'var(--text-dark)', 
                marginBottom: '8px' 
              }}>
                Kampanjnamn *
              </label>
              <input
                {...register('name', { required: 'Kampanjnamn krävs', minLength: { value: 2, message: 'Minst 2 tecken' } })}
                type="text"
                placeholder="t.ex. Snickartjänster Stockholm"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
              />
              {errors.name && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                  {errors.name.message}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-dark)', 
                  marginBottom: '8px' 
                }}>
                  Stad *
                </label>
                <input
                  {...register('city', { required: 'Stad krävs', minLength: { value: 2, message: 'Minst 2 tecken' } })}
                  type="text"
                  placeholder="Stockholm"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-orange)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
                {errors.city && (
                  <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-dark)', 
                  marginBottom: '8px' 
                }}>
                  Radie (km) *
                </label>
                <input
                  {...register('radiusKm', { 
                    required: 'Radie krävs',
                    min: { value: 1, message: 'Minst 1 km' },
                    max: { value: 100, message: 'Max 100 km' }
                  })}
                  type="number"
                  placeholder="20"
                  min="1"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-orange)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
                {errors.radiusKm && (
                  <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.radiusKm.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: 'var(--text-dark)', 
                marginBottom: '8px' 
              }}>
                Budget (kr) *
              </label>
              <input
                {...register('budgetKr', { 
                  required: 'Budget krävs',
                  min: { value: 100, message: 'Minst 100 kr' }
                })}
                type="number"
                placeholder="5000"
                min="100"
                step="100"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
              />
              {errors.budgetKr && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                  {errors.budgetKr.message}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-dark)', 
                  marginBottom: '8px' 
                }}>
                  Startdatum *
                </label>
                <input
                  {...register('startDate', { required: 'Startdatum krävs' })}
                  type="date"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-orange)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
                {errors.startDate && (
                  <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-dark)', 
                  marginBottom: '8px' 
                }}>
                  Slutdatum *
                </label>
                <input
                  {...register('endDate', { required: 'Slutdatum krävs' })}
                  type="date"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-orange)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
                {errors.endDate && (
                  <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end', 
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border-light)'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ padding: '12px 24px' }}
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ 
                padding: '12px 24px',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Skapar...
                </>
              ) : (
                'Skapa kampanj'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}