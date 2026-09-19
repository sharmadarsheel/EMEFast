"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Radio, CheckCircle2, XCircle, Clock, Navigation, Shield,
  Hospital as HospitalIcon, MapPin, ArrowRight, AlertTriangle, Zap, RefreshCw
} from 'lucide-react';
import api from '@/lib/api';
import { EmergencyCase, DecisionEngineResult } from '@/types';

export default function HospitalDiscoveryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#6e7681] font-mono text-xs"><span className="animate-pulse">Connecting to hospital response network...</span></div>}>
      <HospitalDiscoveryInner />
    </Suspense>
  );
}

function HospitalDiscoveryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseIdParam = searchParams.get('case_id');
  const [currentCase, setCurrentCase] = useState<EmergencyCase | null>(null);
  const [decision, setDecision] = useState<DecisionEngineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, [caseIdParam]);

  const fetchData = async () => {
    try {
      let targetId = caseIdParam || (typeof window !== 'undefined' ? localStorage.getItem('emefast_current_case_id') : null);
      let caseData: EmergencyCase | null = null;
      if (targetId) {
        try {
          const res = await api.get(`/emergency/${targetId}`);
          caseData = res.data;
        } catch {
          if (typeof window !== 'undefined') localStorage.removeItem('emefast_current_case_id');
          try {
            const activeRes = await api.get('/emergency/active/current');
            caseData = activeRes.data;
          } catch {}
        }
      } else {
        try {
          const activeRes = await api.get('/emergency/active/current');
          caseData = activeRes.data;
        } catch {}
      }
      if (caseData) {
        setCurrentCase(caseData);
        if (typeof window !== 'undefined') localStorage.setItem('emefast_current_case_id', String(caseData.id));
        try {
          const recRes = await api.get(`/emergency/${caseData.id}/recommendation`);
          setDecision(recRes.data);
        } catch {}
      } else {
        setCurrentCase(null);
        setDecision(null);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleSelect = async (hospitalId: number) => {
    if (!currentCase) return;
    setSelecting(true);
    try {
      await api.post(`/emergency/${currentCase.id}/select-hospital`, { hospital_id: hospitalId });
      router.push(`/user/navigation?case_id=${currentCase.id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to select hospital.');
    } finally { setSelecting(false); }
  };

  if (loading && !currentCase) return (
    <div className="p-12 text-center text-[#6e7681] font-mono space-y-3">
      <Radio className="w-8 h-8 animate-spin mx-auto text-sos-400" />
      <p className="text-xs">Connecting to hospital response network...</p>
    </div>
  );

  if (!currentCase) return (
    <div className="p-12 text-center space-y-4 max-w-md mx-auto">
      <AlertTriangle className="w-10 h-10 mx-auto text-sos-400" />
      <h2 className="text-base font-bold text-white">No Active Emergency Found</h2>
      <p className="text-xs text-[#6e7681]">Create a new emergency case to start hospital discovery.</p>
      <Link href="/user/emergency/new" className="inline-block py-2 px-5 rounded bg-sos-400 text-white text-xs font-semibold">Create Emergency</Link>
    </div>
  );

  const recommended = decision?.recommended_hospital;
  const fastest = decision?.fastest_hospital;
  const cheapest = decision?.cheapest_hospital;

  return (
    <div className="hospital-discovery max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Case Header */}
      <div className="v2-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="badge-red px-2 py-0.5 rounded font-mono font-bold">{currentCase.case_code}</span>
            <span className="text-[#6e7681] font-mono">· {currentCase.transport_mode}</span>
            <span className="text-ok-400 font-mono flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-ok-400 animate-pulse-dot inline-block" />
              Query Active
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">
            {currentCase.patient_name} — <span className="text-sos-300">{currentCase.condition}</span>
          </h1>
          <p className="text-xs text-[#6e7681]">
            Required: <strong className="text-[#8b949e]">{currentCase.requirements}</strong> · Priority: <span className="font-bold text-sos-300">{currentCase.priority}</span>
          </p>
        </div>
        <button onClick={fetchData} className="p-2 rounded border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] flex items-center gap-1 text-xs font-semibold transition-colors shrink-0">
          <RefreshCw size={13} /> Sync
        </button>
      </div>

      {/* Recommended Hero */}
      {recommended ? (
        <div className="v2-card p-5 space-y-4 border border-sos-400/40 shadow-glow-red/20">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sos-400 text-white text-[11px] font-semibold font-mono">
              <Zap size={12} className="fill-white" /> RECOMMENDED BEST OVERALL ACCEPTED OPTION
            </span>
            <span className="text-2xl font-extrabold text-sos-300 font-mono">
              {recommended.eta} <span className="text-xs text-[#6e7681] font-normal">MIN ETA</span><span className="ml-4 text-lg text-white">₹{recommended.estimated_cost?.toLocaleString?.() || recommended.estimated_cost}</span>
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HospitalIcon size={20} className="text-sos-300 shrink-0" />
                {recommended.hospital_name}
              </h2>
              <p className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <MapPin size={12} className="text-[#484f58]" />
                {recommended.hospital_address} · <strong>{recommended.distance_km} km away</strong>
              </p>
              <p className="text-xs text-ok-400 font-semibold">
                ✓ Accepted by ER Desk · {recommended.available_icu} ICU beds available
              </p>
            </div>
            <button
              onClick={() => handleSelect(recommended.hospital_id)}
              disabled={selecting}
              className="sos-btn select-hospital-btn flex items-center gap-2 px-5 py-2.5 text-sm shrink-0"
            >
              <Navigation size={15} />
              {selecting ? 'Selecting...' : 'SELECT HOSPITAL'}
              <ArrowRight size={15} />
            </button>
          </div>

          {recommended.explanation?.length > 0 && (
            <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d] text-xs text-[#8b949e] space-y-1.5">
              <div className="font-mono text-[10px] text-[#484f58] uppercase tracking-wider">Decision Explanation Factors</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {recommended.explanation.map((exp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={11} className="text-ok-400 shrink-0" />
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="v2-card p-5 border border-warn-400/20 bg-warn-400/5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-warn-300">
            <Clock size={14} className="animate-spin" /> Querying Nearby Verified Hospitals...
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Hospitals within range are reviewing the emergency request. As soon as facilities accept, EMEFast will calculate real-time ETAs and recommend the fastest destination.
          </p>
        </div>
      )}

      {decision && (
        <div className="comparison-grid">
          {([
            { label: 'BEST OVERALL', item: recommended, tone: 'red', hint: 'Clinical fit + ETA + resources + cost' },
            { label: 'FASTEST', item: fastest, tone: 'blue', hint: 'Lowest route ETA among accepted feasible hospitals' },
            { label: 'LOWEST EST. COST', item: cheapest, tone: 'amber', hint: 'Lowest estimated emergency cost among accepted options' },
          ] as const).map(card => (
            <div key={card.label} className={`comparison-card ${card.tone}`}>
              <span>{card.label}</span>
              {card.item ? (
                <>
                  <strong>{card.item.hospital_name}</strong>
                  <div><b>{Math.round(card.item.eta)} min</b><b>₹{card.item.estimated_cost.toLocaleString()}</b><b>{card.item.distance_km.toFixed(1)} km</b></div>
                  <small>{card.hint}</small>
                </>
              ) : <><strong>Waiting for acceptance</strong><small>{card.hint}</small></>}
            </div>
          ))}
        </div>
      )}

      {/* All Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio size={14} className="text-sos-400" /> Hospital Responses
          </h3>
          <span className="text-xs font-mono text-[#6e7681]">
            {decision?.accepted_count || 0} Accepted · {decision?.rejected_count || 0} Rejected · {decision?.pending_count || 0} Pending · costs shown per hospital
          </span>
        </div>

        <div className="space-y-2">
          {decision?.all_options?.map(opt => (
            <div
              key={opt.hospital_id}
              className={`v2-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-all ${
                opt.is_recommended ? 'border-sos-400/40' :
                opt.response === 'ACCEPTED' ? 'border-ok-400/20' :
                opt.response === 'REJECTED' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                  opt.response === 'ACCEPTED' ? 'bg-ok-400/10 text-ok-400' :
                  opt.response === 'REJECTED' ? 'bg-sos-400/10 text-sos-300' :
                  'bg-[#21262d] text-[#6e7681]'
                }`}>
                  <HospitalIcon size={16} />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-white text-sm">{opt.hospital_name}</h4>
                    {opt.is_recommended && (
                      <span className="match-badge">BEST OVERALL</span>
                    )}
                    {(opt.score ?? 0) > 0 && (
                      <span className="match-badge">{Math.round(opt.score!)} SCORE</span>
                    )}
                  </div>
                  <p className="text-[#6e7681]">{opt.hospital_address} · {opt.distance_km} km</p>
                  {opt.hospital_capabilities && (
                    <p className="font-mono text-[#484f58]">Specialties: <span className="text-[#8b949e]">{opt.hospital_capabilities}</span></p>
                  )}
                  {opt.rejection_reason && (
                    <p className="text-sos-300 font-semibold">Reason: {opt.rejection_reason}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className={`flex items-center gap-1 font-semibold font-mono text-xs ${
                    opt.response === 'ACCEPTED' ? 'text-ok-400' :
                    opt.response === 'REJECTED' ? 'text-sos-300' :
                    'text-warn-300'
                  }`}>
                    {opt.response === 'ACCEPTED' ? <><CheckCircle2 size={12} /> ACCEPTED ({opt.eta}m)</> :
                     opt.response === 'REJECTED' ? <><XCircle size={12} /> REJECTED</> :
                     <><Clock size={12} /> PENDING</>}
                  </div>
                  <span className="text-[10px] text-[#484f58] font-mono block">ICU: {opt.available_icu} · Est. cost: ₹{opt.estimated_cost?.toLocaleString?.() || opt.estimated_cost}</span>
                </div>
                {opt.response === 'ACCEPTED' && (
                  <button
                    onClick={() => handleSelect(opt.hospital_id)}
                    disabled={selecting}
                    className="py-1.5 px-3 rounded border border-[#30363d] bg-[#21262d] hover:bg-sos-400 hover:border-sos-400 hover:text-white text-[#8b949e] font-semibold text-xs flex items-center gap-1 transition-all"
                  >
                    Select <ArrowRight size={11} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
