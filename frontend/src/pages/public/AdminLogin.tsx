import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn, AlertCircle, Info, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Access Denied: Your account does not possess Super Administrator privileges.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 bg-slate-900/95 border-rose-500/20 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center font-bold border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Administrator</h2>
          <p className="text-xs text-rose-300/80">Protected Master Platform Management Console</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="admin-email"
            type="email"
            label="Administrator Email"
            placeholder="admin@ruralverse.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="admin-password"
            type="password"
            label="Master Password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="danger" className="w-full mt-2 font-bold shadow-rose-500/20" loading={loading}>
            <Lock className="w-4 h-4 mr-2" /> Authenticate Administrator
          </Button>
        </form>

        {/* Secure Bootstrap Notice */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Initial Setup & Bootstrap:</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Admin accounts are securely provisioned on first startup via server environment variables (<code className="text-slate-300">INITIAL_ADMIN_EMAIL</code> & <code className="text-slate-300">INITIAL_ADMIN_PASSWORD</code>). No hardcoded passwords exist in frontend source code.
          </p>
        </div>
      </Card>
    </div>
  );
};
