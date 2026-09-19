"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Radio, Lock, Mail, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (loginEmail?: string, loginPass?: string) => {
    setError('');
    setLoading(true);
    const useEmail = loginEmail || email;
    const usePass = loginPass || password;
    try {
      const formData = new FormData();
      formData.append('username', useEmail);
      formData.append('password', usePass);
      const res = await api.post('/auth/login', formData);
      const { access_token, role, user_name, hospital_id } = res.data;
      localStorage.setItem('emefast_token', access_token);
      localStorage.setItem('emefast_role', role);
      localStorage.setItem('emefast_user_name', user_name);
      if (hospital_id) localStorage.setItem('emefast_hospital_id', hospital_id.toString());
      if (role === 'HOSPITAL') router.push('/hospital/dashboard');
      else if (role === 'ADMIN') router.push('/admin/dashboard');
      else router.push('/user/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded bg-sos-400 flex items-center justify-center">
              <Radio className="w-5 h-5 text-[var(--text)]" />
            </div>
            <span className="text-xl font-bold text-[var(--text)]">EMEFast</span>
          </Link>
          <h2 className="text-lg font-bold text-[var(--text)]">Access Emergency Network</h2>
          <p className="text-xs text-[var(--muted)]">Select your role or enter credentials</p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
          className="v2-card p-5 space-y-4"
        >
          {error && (
            <div className="p-3 rounded border border-sos-400/30 bg-sos-400/10 text-sos-300 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--muted)]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--subtle)]" size={14} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="v2-input pl-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--muted)]">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--subtle)]" size={14} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="v2-input pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-sos-400 hover:bg-sos-500 text-[var(--text)] font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight size={15} />
          </button>
        </form>

        <p className="text-center text-xs text-[var(--subtle)]">
          <Link href="/" className="text-sos-300 hover:underline">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
