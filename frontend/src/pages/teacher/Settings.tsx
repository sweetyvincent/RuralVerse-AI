import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await authService.updateProfile({ full_name: fullName });
      await refreshUser();
      setMessage('Profile updated.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Update failed.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password updated.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Password update failed.');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Educator Profile & Security</h1>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> <span>{error}</span>
        </div>
      )}

      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white">Profile</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Button type="submit" variant="primary" size="sm">Save</Button>
        </form>
      </Card>

      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white">Security Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input type="password" label="Current" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <Input type="password" label="New" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <Button type="submit" variant="outline" size="sm">Update Password</Button>
        </form>
      </Card>
    </div>
  );
};
