import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { adminService } from '../../services/admin';
import { Bot, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const AiConfig: React.FC = () => {
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [systemInstructions, setSystemInstructions] = useState('');
  const [testResult, setTestResult] = useState<{ status: string; message?: string; response?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    adminService.getAiConfig().then((cfg) => {
      setModelName(cfg.model_name);
      setTemperature(cfg.temperature);
      setMaxTokens(cfg.max_tokens);
      setSystemInstructions(cfg.system_instructions);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await adminService.updateAiConfig({
        model_name: modelName,
        temperature,
        max_tokens: maxTokens,
        system_instructions: systemInstructions,
      });
      setMessage('AI Tutor parameters successfully saved.');
    } catch (e) {
      alert('Failed to save AI configuration.');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminService.testAiConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">AI Multilingual Tutor Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">Configure foundational LLM model behavior, temperature, and grounding instructions.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> <span>{message}</span>
        </div>
      )}

      {/* Connection Test Panel */}
      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" /> Live AI Provider Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Verify connection with Google Gemini API</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleTestConnection} loading={testing}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Test Live Connection
          </Button>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              testResult.status === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : testResult.status === 'unconfigured'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              {testResult.status === 'connected' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>Status: {testResult.status.toUpperCase()}</span>
            </div>
            {testResult.response && <div>Ping response from model: "{testResult.response}"</div>}
            {testResult.message && <div className="text-[11px] opacity-80">{testResult.message}</div>}
          </div>
        )}
      </Card>

      {/* Configuration Form */}
      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Model Name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              required
            />

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Temperature ({temperature})
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 mt-2"
              />
            </div>

            <Input
              type="number"
              label="Max Output Tokens"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">
              Tutor Pedagogical System Prompt
            </label>
            <textarea
              rows={6}
              value={systemInstructions}
              onChange={(e) => setSystemInstructions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <Button type="submit" variant="glow">
            Save AI Parameters
          </Button>
        </form>
      </Card>
    </div>
  );
};
