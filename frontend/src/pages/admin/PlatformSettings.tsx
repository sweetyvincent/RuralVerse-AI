import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { adminService } from '../../services/admin';
import { Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';

export const PlatformSettings: React.FC = () => {
  const [platformName, setPlatformName] = useState('RuralVerse AI');
  const [contactEmail, setContactEmail] = useState('support@ruralverse.org');
  const [offlineSyncInterval, setOfflineSyncInterval] = useState('30');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    adminService.getSettings().then((s) => {
      if (s.platform_name) setPlatformName(s.platform_name);
      if (s.contact_email) setContactEmail(s.contact_email);
      if (s.offline_sync_interval) setOfflineSyncInterval(s.offline_sync_interval);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await adminService.updateSettings({
        platform_name: platformName,
        contact_email: contactEmail,
        offline_sync_interval: offlineSyncInterval,
      });
      setMessage('Platform settings updated successfully.');
    } catch (e) {
      alert('Failed to update platform settings.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Platform Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">Branding, institutional contact info, and synchronization policies.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> <span>{message}</span>
        </div>
      )}

      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Platform Name & Branding"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            required
          />

          <Input
            label="Institutional Contact Email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />

          <Input
            label="Offline Progress Sync Interval (seconds)"
            type="number"
            value={offlineSyncInterval}
            onChange={(e) => setOfflineSyncInterval(e.target.value)}
            required
          />

          <Button type="submit" variant="glow" size="sm">
            Save Global Settings
          </Button>
        </form>
      </Card>
    </div>
  );
};
