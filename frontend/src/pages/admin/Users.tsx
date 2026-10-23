import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { adminService } from '../../services/admin';
import { User } from '../../types';
import { Users as UsersIcon, Search, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    adminService.getUsers({ role: roleFilter || undefined, search: search || undefined })
      .then((res) => setUsers(res.users))
      .catch((err) => console.log('Error loading users:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleActive = async (user: User) => {
    setMessage(null);
    setError(null);
    try {
      await adminService.updateUser(user.id, { is_active: !user.is_active });
      setMessage(`User ${user.email} status updated.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update user status.');
    }
  };

  const handleChangeRole = async (user: User, newRole: string) => {
    setMessage(null);
    setError(null);
    try {
      await adminService.updateUser(user.id, { role: newRole });
      setMessage(`User ${user.email} promoted/changed to ${newRole}.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update role.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">User Administration</h1>
          <p className="text-xs text-slate-400 mt-1">Manage platform accounts, security roles, and active statuses.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Administrators</option>
          </select>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 w-44"
            />
            <Button type="submit" variant="outline" size="sm">
              <Search className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> <span>{error}</span>
        </div>
      )}

      <Card className="bg-slate-900/90 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Language / Grade</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.full_name}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2 py-1"
                    >
                      <option value="student">student</option>
                      <option value="teacher">teacher</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <Badge variant={u.is_active ? 'emerald' : 'rose'}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-300 uppercase">{u.preferred_language}</div>
                    <div className="text-[10px] text-slate-500">{u.grade || '—'}</div>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant={u.is_active ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
