import React, { useState, useEffect } from 'react';
import { meetingTranscript } from '../mockScenarios';
import {
  MessageSquare, CheckCircle2, AlertTriangle, Clock, User,
  ArrowRight, Zap, Filter
} from 'lucide-react';

export function MeetingIntelView() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [extractionDone, setExtractionDone] = useState(false);
  const [filter, setFilter] = useState('all');
  const mt = meetingTranscript;

  useEffect(() => {
    if (visibleLines < mt.lines.length) {
      const timer = setTimeout(() => {
        setVisibleLines(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setExtractionDone(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [visibleLines, mt.lines.length]);

  const filteredItems = mt.extractedItems.filter(item =>
    filter === 'all' || item.type === filter
  );

  return (
    <div>
      <h1 className="text-3xl font-light mb-8 text-white">Meeting <span className="font-bold text-cyan-400">Intelligence</span></h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transcript Panel */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-400" /> Live Transcript
            </h2>
            <span className="text-xs text-zinc-500">{mt.date}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {mt.attendees.map((a, i) => (
              <span key={i} className="px-2 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400 flex items-center gap-1">
                <User className="h-3 w-3" /> {a}
              </span>
            ))}
          </div>
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
            {mt.lines.slice(0, visibleLines).map((line, idx) => (
              <div key={idx} className="animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">
                      {line.speaker.split(' ').map(w => w[0]).join('')}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-cyan-300">{line.speaker}</span>
                      <span className="text-[10px] text-zinc-600 font-mono">{line.time}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{line.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {visibleLines < mt.lines.length && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 py-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div>
                MeetIntel Agent listening...
              </div>
            )}
          </div>
        </div>

        {/* Extraction Panel */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-400" /> Extracted Intelligence
            </h2>
            {!extractionDone && visibleLines >= mt.lines.length && (
              <span className="text-xs text-yellow-400 flex items-center gap-1 animate-pulse">
                <Clock className="h-3 w-3" /> Extracting...
              </span>
            )}
          </div>

          {!extractionDone && visibleLines < mt.lines.length && (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
              <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Waiting for transcript analysis...</p>
            </div>
          )}

          {extractionDone && (
            <>
              {/* Filters */}
              <div className="flex gap-2 mb-4">
                {['all', 'decision', 'action', 'escalation'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                      filter === f ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-zinc-800 text-zinc-500 border border-transparent hover:text-zinc-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Items */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredItems.map((item, idx) => (
                  <div key={idx} className="bg-black/40 p-4 rounded-xl border border-zinc-800 animate-fade-in">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.type === 'decision' && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                        {item.type === 'action' && <ArrowRight className="h-4 w-4 text-cyan-400" />}
                        {item.type === 'escalation' && <AlertTriangle className="h-4 w-4 text-yellow-400" />}
                        <span className={`text-xs uppercase font-bold tracking-wider ${
                          item.type === 'decision' ? 'text-green-400' : item.type === 'action' ? 'text-cyan-400' : 'text-yellow-400'
                        }`}>{item.type}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === 'decided' || item.status === 'resolved' ? 'bg-green-400/10 text-green-400' :
                        item.status === 'in-progress' ? 'bg-cyan-400/10 text-cyan-400' :
                        'bg-zinc-700/50 text-zinc-400'
                      }`}>{item.status}</span>
                    </div>
                    <p className="text-sm text-zinc-200 mb-2">{item.text}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {item.owner}</span>
                      {item.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {item.deadline}
                          {item.daysLeft <= 1 && <span className="text-red-400 font-bold ml-1">URGENT</span>}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
