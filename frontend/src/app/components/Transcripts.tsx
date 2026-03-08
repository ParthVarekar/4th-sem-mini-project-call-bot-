import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Loader2, MessageSquare, MoreVertical, Pause, Play, Search } from 'lucide-react';
import { motion } from 'motion/react';

import { FrequentCustomerTracker } from './FrequentCustomerTracker';
import { TranscriptCall, transcriptsService } from '../services/transcriptsService';

const getDiscountForTier = (tier: TranscriptCall['tier']): number => {
  switch (tier) {
    case 'Platinum':
      return 20;
    case 'Gold':
      return 15;
    case 'Silver':
      return 10;
    default:
      return 5;
  }
};

export const Transcripts: React.FC = () => {
  const [calls, setCalls] = useState<TranscriptCall[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCall, setSelectedCall] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTranscripts() {
      try {
        const result = await transcriptsService.fetchTranscripts();
        setCalls(result);
        setSelectedCall(result[0]?.id || null);
      } catch (error) {
        console.error('Failed to load transcripts', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTranscripts();
  }, []);

  const filteredCalls = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) {
      return calls;
    }
    return calls.filter((call) => {
      return [call.customer, call.phone, call.type, call.summary].some((value) => value.toLowerCase().includes(query));
    });
  }, [calls, search]);

  const selectedCallData = filteredCalls.find((call) => call.id === selectedCall) || calls.find((call) => call.id === selectedCall) || null;

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-white/5 bg-[#13131a] shadow-xl md:w-1/3">
        <div className="border-b border-white/5 p-4">
          <h2 className="mb-4 font-bold text-white">Recent Calls</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transcripts..."
              className="w-full rounded-lg border border-white/5 bg-[#1c1c24] py-2 pl-9 pr-4 text-sm text-slate-300 placeholder-slate-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredCalls.map((call) => (
            <button
              key={call.id}
              onClick={() => setSelectedCall(call.id)}
              className={`w-full border-b border-white/5 p-4 text-left transition-colors hover:bg-white/5 ${selectedCall === call.id ? 'border-l-4 border-l-orange-500 bg-orange-500/10' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="mb-1 flex items-start justify-between">
                <span className="text-sm font-semibold text-slate-200">{call.customer}</span>
                <span className="text-xs text-slate-500">{call.time}</span>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={`rounded px-2 py-0.5 font-medium ${call.status === 'Missed' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {call.status}
                </span>
                <span>{call.type}</span>
                <span>{call.summary}</span>
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" /> {call.duration}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-white/5 bg-[#13131a] shadow-xl md:w-2/3">
        {selectedCallData ? (
          <>
            <div className="space-y-3 border-b border-white/5 bg-[#18181b] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/20 font-bold text-orange-500">
                    {selectedCallData.customer.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{selectedCallData.customer}</h3>
                    <p className="text-xs text-slate-500">Recorded at {selectedCallData.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsPlaying((current) => !current)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/5">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/5">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <FrequentCustomerTracker
                customer={{
                  phone: selectedCallData.phone,
                  name: selectedCallData.customer,
                  callCount: selectedCallData.callCount,
                  tier: selectedCallData.tier,
                  discount: getDiscountForTier(selectedCallData.tier),
                  autoApply: true,
                  nextTierCalls: selectedCallData.tier === 'Platinum' ? 0 : Math.max(0, 10 - (selectedCallData.callCount % 10)),
                }}
                compact
              />
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto bg-[#0f1115]/50 p-6">
              {selectedCallData.messages.map((message, index) => (
                <motion.div
                  key={`${message.sender}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${message.sender === 'AI' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${message.sender === 'AI' ? 'rounded-tl-none border border-white/5 bg-[#1c1c24] text-slate-300' : 'rounded-tr-none bg-orange-600 text-white'}`}>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className={`mt-2 text-[10px] opacity-70 ${message.sender === 'AI' ? 'text-slate-500' : 'text-orange-200'}`}>
                      {message.sender} - {message.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-white/5 bg-[#13131a] p-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500">00:15</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#27272a]">
                  <div className="h-full w-1/3 rounded-full bg-orange-500" />
                </div>
                <span className="font-mono text-xs text-slate-500">{selectedCallData.duration}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-600">
            <MessageSquare className="h-12 w-12 opacity-20" />
            <p>Select a call to view its transcript.</p>
          </div>
        )}
      </div>
    </div>
  );
};
