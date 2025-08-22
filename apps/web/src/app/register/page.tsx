'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password, name || undefined);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <div style={{ background: 'var(--bg-white)', borderRadius: '16px', padding: '48px 32px', boxShadow: 'var(--shadow-medium)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <i className="fas fa-hammer" style={{ fontSize: '32px', color: 'var(--primary-orange)', marginRight: '12px' }}></i>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>AnnonsHjälpen</h1>
            </div>
            <p style={{ color: 'var(--text-medium)', fontSize: '16px', margin: 0 }}>Skapa ditt konto</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-dark)', marginBottom: '8px' }}>
                Namn (valfritt)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-dark)', marginBottom: '8px' }}>
                E-post
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-dark)', marginBottom: '8px' }}>
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
              <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '4px 0 0 0' }}>
                Minst 6 tecken
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '24px',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Skapar konto...' : 'Skapa konto'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-medium)', fontSize: '14px', margin: 0 }}>
              Har du redan ett konto? <Link href="/login" style={{ color: 'var(--primary-orange)', textDecoration: 'none', fontWeight: '600' }}>Logga in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}