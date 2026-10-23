import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';

export const TeacherLogin: React.FC = () => {
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
      if (user.role === 'teacher' || user.role === 'admin') {
        navigate('/teacher/dashboard');
      } else {
        setError('This portal is restricted to authorized Teachers and Educators.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid teacher credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 bg-slate-900/90 border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Teacher Console Sign In</h2>
          <p className="text-xs text-slate-400">Class management, assessment review, and performance analytics</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Teacher Email"
            placeholder="teacher@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white" loading={loading}>
            <LogIn className="w-4 h-4 mr-2" /> Sign In to Teacher Console
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          Need a student account?{' '}
          <Link to="/student/login" className="text-cyan-400 font-semibold hover:underline">
            Go to Student Portal
          </Link>
        </div>
      </Card>
    </div>
  );
};
