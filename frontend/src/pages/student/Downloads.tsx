import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Download, Trash2, BookOpen, HardDrive, WifiOff } from 'lucide-react';
import { Lesson } from '../../types';

export const Downloads: React.FC = () => {
  const [offlineLessons, setOfflineLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    // Scan localStorage for offline cached lessons
    const items: Lesson[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('offline_lesson_')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '{}');
          items.push(parsed);
        } catch (e) {}
      }
    }
    setOfflineLessons(items);
  }, []);

  const handleDelete = (id: number) => {
    localStorage.removeItem(`offline_lesson_${id}`);
    setOfflineLessons((prev) => prev.filter((l) => l.id !== id));
  };

  const handleClearAll = () => {
    offlineLessons.forEach((l) => localStorage.removeItem(`offline_lesson_${l.id}`));
    setOfflineLessons([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Offline Resource Library</h1>
          <p className="text-xs text-slate-400 mt-1">
            Lessons and materials downloaded to your device for reading without internet connectivity.
          </p>
        </div>

        {offlineLessons.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll} className="text-red-400 border-red-500/30">
            <Trash2 className="w-4 h-4 mr-1.5" /> Clear All Downloads
          </Button>
        )}
      </div>

      <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Offline Synchronization Ready</h4>
            <p className="text-xs text-amber-200/80">
              When disconnected from cellular/Wi-Fi, all downloaded lessons can be read completely offline.
            </p>
          </div>
        </div>
        <Badge variant="amber">{offlineLessons.length} Cached Modules</Badge>
      </div>

      <Card className="p-6 bg-slate-900/90 border-slate-800">
        {offlineLessons.length > 0 ? (
          <div className="space-y-3">
            {offlineLessons.map((l) => (
              <div
                key={l.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white">{l.title}</h4>
                    <p className="text-[10px] text-slate-500">Duration: {l.duration_minutes || 20} min</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Saved Locally
                  </span>
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove from device"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 space-y-2 text-xs">
            <HardDrive className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-400">No offline lessons cached.</p>
            <p>Open any lesson in the Lesson Library and click "Download for Offline" to store it here.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
