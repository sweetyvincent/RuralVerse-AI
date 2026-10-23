import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { adminService } from '../../services/admin';
import { AuditLogItem } from '../../types';
import { FileText, Shield, Clock } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAuditLogs({ page_size: 50 })
      .then((res) => setLogs(res.logs))
      .catch((err) => console.log('Error fetching audit logs:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Security Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-1">
          Append-only cryptographic record of administrative actions, role modifications, and content lifecycle events.
        </p>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Target Type</th>
                <th className="p-4">Details</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="p-4 font-mono font-bold text-cyan-400">{log.action}</td>
                  <td className="p-4">{log.actor_email || `User #${log.actor_id}`}</td>
                  <td className="p-4 uppercase text-[10px] text-slate-400">{log.target_type || '—'}</td>
                  <td className="p-4 text-slate-400 max-w-xs truncate">{log.details || '—'}</td>
                  <td className="p-4 text-right text-slate-500 text-[10px]">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No administrative audit entries recorded yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
