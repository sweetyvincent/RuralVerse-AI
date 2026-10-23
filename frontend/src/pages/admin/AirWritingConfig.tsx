import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { airWritingService } from '../../services/airWriting';
import { HandMetal, CheckCircle2 } from 'lucide-react';

export const AirWritingConfig: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [colors, setColors] = useState<string[]>(['#00E5FF', '#A855F7', '#10B981', '#F59E0B', '#EF4444', '#FFFFFF']);
  const [brushSizes, setBrushSizes] = useState<number[]>([2, 4, 8, 12, 18]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    airWritingService.getConfig().then((cfg) => {
      setIsEnabled(cfg.is_enabled);
      if (cfg.available_colors?.length) setColors(cfg.available_colors);
      if (cfg.available_brush_sizes?.length) setBrushSizes(cfg.available_brush_sizes);
    });
  }, []);

  const handleSave = async () => {
    setMessage(null);
    try {
      await airWritingService.updateConfig({
        is_enabled: isEnabled,
        available_colors: colors,
        available_brush_sizes: brushSizes,
      });
      setMessage('Air-Writing studio settings updated.');
    } catch (e) {
      alert('Failed to update config.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Air-Writing Studio Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">Configure global gestures, brush palettes, and camera safety guidance.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> <span>{message}</span>
        </div>
      )}

      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Enable Air-Writing Globally</h3>
            <p className="text-xs text-slate-400">Allow students to utilize MediaPipe webcam hand tracking.</p>
          </div>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="w-5 h-5 accent-cyan-500 rounded"
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Default Color Palette</h4>
          <div className="flex gap-2">
            {colors.map((c) => (
              <div key={c} className="w-9 h-9 rounded-xl border border-white/20 shadow-md" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Stroke Widths</h4>
          <div className="flex gap-2">
            {brushSizes.map((s) => (
              <div key={s} className="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-white">
                {s} px
              </div>
            ))}
          </div>
        </div>

        <Button variant="glow" onClick={handleSave}>
          Save Studio Configuration
        </Button>
      </Card>
    </div>
  );
};
