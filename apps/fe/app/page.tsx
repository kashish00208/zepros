'use client';

import { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  ArrowUpRight, 
  BrainCircuit, 
  Clock, 
  Layers, 
  RefreshCw, 
  Sparkles, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Terminal
} from 'lucide-react';

type TraceItem = {
  traceId?: string;
  hasError?: boolean;
  name?: string;
  durationMs?: number;
  service?: string;
  spans?: { name: string; durationPct: number; hasError?: boolean }[];
  [key: string]: any;
};

export default function ZeroTraceDashboard() {
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceItem | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const COLLECTOR_URL ='http://collector:8080';
  const AI_URL = 'http://ai-engine:5000';

  const fetchTraces = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`http://localhost:8080/v1/traces`);
      const data = await res.json();
      setTraces(data);
    } catch (err) {
      console.error('Collector link pending...', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchTraces();
    const interval = window.setInterval(fetchTraces, 3000);
    return () => window.clearInterval(interval);
  }, [COLLECTOR_URL]);

  const triggerAiRca = async (trace: TraceItem) => {
    setSelectedTrace(trace);
    setLoadingAi(true);
    setAiAnalysis('');

    try {
      const res = await fetch(`http://localhost:8080/v1/traces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trace }),
      });
      const data = await res.json();
      setAiAnalysis(data.analysis || data.message || 'Analysis complete with no issues detected.');
    } catch (err) {
      setAiAnalysis('Failed to contact ZeroTrace AI Engine. Ensure service endpoint is reachable.');
    } finally {
      setLoadingAi(false);
    }
  };

  const averageLatency = traces.length
    ? Math.round(traces.reduce((sum, trace) => sum + (trace.durationMs || 120), 0) / traces.length)
    : 0;
  const errorCount = traces.filter((trace) => trace.hasError).length;
  const errorRate = traces.length ? ((errorCount / traces.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Background Subtle Mesh */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-md md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                <Activity className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">ZeroTrace Platform</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Live Observability & RCA</h1>
            <p className="text-sm text-zinc-400">
              OpenTelemetry event ingestion with real-time AI root-cause analysis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live Receiver Active
            </div>
            <button
              onClick={fetchTraces}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              title="Refresh telemetry data"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Metrics Bar */}
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
              <span>Total Traces</span>
              <TrendingUp className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-zinc-100">{traces.length}</span>
              <span className="text-xs text-zinc-500">events logged</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
              <span>Average Latency</span>
              <Clock className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-zinc-100">{averageLatency}</span>
              <span className="text-xs text-zinc-500">ms</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
              <span>Error Rate</span>
              <AlertTriangle className={`h-4 w-4 ${errorCount > 0 ? 'text-rose-400' : 'text-zinc-500'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-zinc-100">{errorRate}%</span>
              <span className="text-xs text-zinc-500">({errorCount} failed)</span>
            </div>
          </div>
        </section>

        {/* Main Grid Layout */}
        <main className="grid gap-6 lg:grid-cols-12">
          {/* Traces Feed Panel */}
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm lg:col-span-5">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Live Traces</h2>
              </div>
              <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-xs font-mono text-zinc-400">
                {traces.length} items
              </span>
            </div>

            <div className="max-h-160 space-y-2.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {traces.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 p-12 text-center">
                  <Terminal className="mb-2 h-8 w-8 text-zinc-600" />
                  <p className="text-sm text-zinc-400">Waiting for incoming telemetry stream...</p>
                </div>
              ) : (
                traces.map((trace, index) => {
                  const isSelected = selectedTrace?.traceId === trace.traceId;
                  return (
                    <button
                      key={trace.traceId || index}
                      type="button"
                      onClick={() => triggerAiRca(trace)}
                      className={`group w-full rounded-lg border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-cyan-500/50 bg-cyan-500/10 shadow-sm'
                          : 'border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/80'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {trace.hasError ? (
                            <XCircle className="h-4 w-4 text-rose-400" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          )}
                          <span className="font-mono text-xs font-medium text-cyan-400">
                            {trace.traceId ? trace.traceId.slice(0, 8) : `TRC-${index}`}
                          </span>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                            trace.hasError
                              ? 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
                              : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {trace.hasError ? 'ERR 500' : 'OK 200'}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-zinc-200 group-hover:text-white">
                        {trace.name || 'HTTP /api/v1/checkout'}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                        <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                          {trace.service || 'target-app'}
                        </span>
                        <span className="font-mono">{trace.durationMs || 120}ms</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Detailed Timeline & AI Analysis Panels */}
          <section className="space-y-6 lg:col-span-7">
            {/* Waterfall Timeline */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Trace Timeline</h2>
                  <p className="text-xs text-zinc-400">Execution waterfall for selected span context</p>
                </div>
                <span className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-400">
                  {selectedTrace ? 'Active Context' : 'No Selection'}
                </span>
              </div>

              {selectedTrace ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <div>
                      <span className="text-xs text-zinc-500">Root Endpoint</span>
                      <div className="font-mono text-sm font-medium text-zinc-200">{selectedTrace.name}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500">Total Latency</span>
                      <div className="font-mono text-sm font-semibold text-cyan-400">{selectedTrace.durationMs || 120}ms</div>
                    </div>
                  </div>

                  {/* Waterfall Bars */}
                  <div className="space-y-3 pt-1">
                    {(selectedTrace.spans || [
                      { name: 'gateway.proxy', durationPct: 100 },
                      { name: 'app.controller', durationPct: 78 },
                      { name: 'database.query', durationPct: 45, hasError: selectedTrace.hasError },
                    ]).map((span, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono text-zinc-400">
                          <span>{span.name}</span>
                          <span>{span.durationPct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              span.hasError ? 'bg-rose-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${span.durationPct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center text-xs text-zinc-400">
                  Select a trace from the feed to view its request hierarchy.
                </div>
              )}
            </div>

            {/* AI RCA Analysis Box */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">AI Root Cause Analysis</h2>
                </div>
                {loadingAi && (
                  <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs text-cyan-300">
                    <Sparkles className="h-3 w-3 animate-pulse" /> Evaluating...
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-4 min-h-[120px]">
                {loadingAi ? (
                  <div className="flex h-24 items-center justify-center gap-2 text-sm text-zinc-400">
                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                    <span>Analyzing spans and log context...</span>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                      <Sparkles className="h-3.5 w-3.5" /> Diagnosis Summary
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{aiAnalysis}</p>
                  </div>
                ) : (
                  <div className="flex h-20 items-center justify-center text-xs text-zinc-400">
                    <ArrowUpRight className="mr-1.5 h-4 w-4" /> Click any trace above to trigger instant AI diagnostics.
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}