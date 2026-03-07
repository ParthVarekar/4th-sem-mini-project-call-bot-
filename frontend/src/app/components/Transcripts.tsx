import React, { useState } from 'react';
import { Phone, Clock, User, MessageSquare, Play, Pause, MoreVertical, Search, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FrequentCustomerTracker } from './FrequentCustomerTracker';

interface Call {
  id: number;
  customer: string;
  phone: string;
  time: string;
  duration: string;
  status: string;
  type: string;
  callCount?: number;
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

const calls: Call[] = [
  { id: 1, customer: 'John Doe', phone: '(555) 123-4567', time: '10:30 AM', duration: '2:15', status: 'Completed', type: 'Reservation', callCount: 8, tier: 'Bronze' },
  { id: 2, customer: 'Sarah Smith', phone: '(555) 234-5678', time: '11:45 AM', duration: '1:45', status: 'Missed', type: 'Inquiry', callCount: 24, tier: 'Gold' },
  { id: 3, customer: 'Mike Johnson', phone: '(555) 345-6789', time: '12:15 PM', duration: '3:30', status: 'Completed', type: 'Order', callCount: 15, tier: 'Silver' },
  { id: 4, customer: 'Emily Davis', phone: '(555) 456-7890', time: '1:00 PM', duration: '0:50', status: 'Completed', type: 'Complaint', callCount: 35, tier: 'Platinum' },
  { id: 5, customer: 'Chris Wilson', phone: '(555) 567-8901', time: '2:30 PM', duration: '4:10', status: 'Completed', type: 'Order' },
];

const getDiscountForTier = (tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'): number => {
  switch (tier) {
    case 'Bronze': return 5;
    case 'Silver': return 10;
    case 'Gold': return 15;
    case 'Platinum': return 20;
    default: return 0;
  }
};

const transcript = [
  { sender: 'AI', text: 'Hello, thanks for calling The Gourmet Kitchen. How can I help you today?', time: '10:30 AM' },
  { sender: 'Customer', text: 'Hi, I’d like to make a reservation for two people tonight.', time: '10:30 AM' },
  { sender: 'AI', text: 'Certainly! What time would you prefer?', time: '10:31 AM' },
  { sender: 'Customer', text: 'Around 7:00 PM if possible.', time: '10:31 AM' },
  { sender: 'AI', text: 'I have a table available at 7:15 PM. Would that work for you?', time: '10:31 AM' },
  { sender: 'Customer', text: 'Yes, that’s perfect.', time: '10:32 AM' },
  { sender: 'AI', text: 'Great! I have booked a table for two at 7:15 PM under your phone number. Is there anything else?', time: '10:32 AM' },
  { sender: 'Customer', text: 'No, that’s all. Thanks!', time: '10:32 AM' },
];

export const Transcripts: React.FC = () => {
  const [selectedCall, setSelectedCall] = useState<number | null>(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedCallData = calls.find(c => c.id === selectedCall);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Call List */}
      <div className="w-full md:w-1/3 bg-[#13131a] rounded-xl border border-white/5 shadow-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-bold text-white mb-4">Recent Calls</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search transcripts..." 
              className="w-full pl-9 pr-4 py-2 bg-[#1c1c24] border border-white/5 rounded-lg text-sm text-slate-300 focus:ring-orange-500 focus:border-orange-500 placeholder-slate-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {calls.map((call) => (
            <div 
              key={call.id}
              onClick={() => setSelectedCall(call.id)}
              className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${selectedCall === call.id ? 'bg-orange-500/10 border-l-4 border-l-orange-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-slate-200 text-sm">{call.customer}</span>
                <span className="text-xs text-slate-500">{call.time}</span>
              </div>
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${call.status === 'Missed' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {call.status}
                    </span>
                    <span className="text-xs text-slate-500">• {call.type}</span>
                 </div>
                 <span className="text-xs text-slate-500 flex items-center gap-1">
                   <Clock className="w-3 h-3" /> {call.duration}
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript View */}
      <div className="w-full md:w-2/3 bg-[#13131a] rounded-xl border border-white/5 shadow-xl flex flex-col overflow-hidden relative">
        {selectedCall ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-[#18181b] space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold border border-orange-500/30">
                    {selectedCallData?.customer.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{selectedCallData?.customer}</h3>
                    <p className="text-xs text-slate-500">Recorded on {selectedCallData?.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Frequent Customer Badge */}
              {selectedCallData?.tier && selectedCallData?.callCount && (
                <FrequentCustomerTracker 
                  customer={{
                    phone: selectedCallData.phone,
                    name: selectedCallData.customer,
                    callCount: selectedCallData.callCount,
                    tier: selectedCallData.tier,
                    discount: getDiscountForTier(selectedCallData.tier),
                    autoApply: true,
                    nextTierCalls: selectedCallData.tier === 'Platinum' ? 0 : (10 - (selectedCallData.callCount % 10))
                  }}
                  compact={true}
                />
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0f1115]/50">
              {transcript.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex ${msg.sender === 'AI' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    msg.sender === 'AI' 
                      ? 'bg-[#1c1c24] border border-white/5 text-slate-300 rounded-tl-none' 
                      : 'bg-orange-600 text-white rounded-tr-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-2 opacity-70 ${msg.sender === 'AI' ? 'text-slate-500' : 'text-orange-200'}`}>
                      {msg.sender} • {msg.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Audio Player Bar */}
            <div className="p-4 border-t border-white/5 bg-[#13131a]">
               <div className="flex items-center gap-3">
                 <span className="text-xs text-slate-500 font-mono">00:15</span>
                 <div className="flex-1 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 w-1/4 rounded-full"></div>
                 </div>
                 <span className="text-xs text-slate-500 font-mono">02:15</span>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-4">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>Select a call to view transcript</p>
          </div>
        )}
      </div>
    </div>
  );
};
