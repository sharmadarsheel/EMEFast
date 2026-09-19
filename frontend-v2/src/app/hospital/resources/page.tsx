"use client";
import { useEffect, useState } from 'react';
import { Hospital as HospitalIcon, Activity, Shield, Heart, Minus, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Hospital } from '@/types';

export default function ResourcesPage() {
  const [info, setInfo] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const hospId = localStorage.getItem('emefast_hospital_id') || '2';
        const res = await api.get(`/hospitals/${hospId}`);
        setInfo(res.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchInfo();
  }, []);

  const updateResource = async (patch: Partial<Hospital>) => { if (!info) return; const next={...info,...patch}; setInfo(next); try { const res=await api.patch(`/hospitals/${info.id}/resources`,patch); setInfo(res.data); } catch {} };

  const resources = [
    { label: 'Available ICU Beds', value: info?.available_icu ?? '—', color: 'text-ok-400', icon: Heart },
    { label: 'Trauma Level', value: info?.trauma_level ?? 'Tier 1', color: 'text-warn-300', icon: Shield },
    { label: 'ER Status', value: info?.verified ? 'Operational' : 'Offline', color: info?.verified ? 'text-ok-400' : 'text-sos-300', icon: Activity },
    { label: 'Specialties', value: info?.capabilities ?? 'General', color: 'text-info-300', icon: HospitalIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6e7681] font-semibold uppercase tracking-wider mb-1">
          <HospitalIcon size={13} /> Resource Management
        </div>
        <h1 className="text-2xl font-bold text-white">Resources & Readiness</h1>
        <p className="text-xs text-[#6e7681] mt-0.5">{info?.name || 'Hospital'} — Current capacity status</p>
      </div>

      {/* Hospital info */}
      <div className="v2-card p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`badge-${info?.verified ? 'green' : 'red'} text-xs px-2 py-0.5 rounded font-mono font-bold`}>
            {info?.verified ? '✓ VERIFIED' : 'UNVERIFIED'}
          </span>
          <h2 className="text-sm font-bold text-white">{info?.name}</h2>
        </div>
        <p className="text-xs text-[#6e7681]">{info?.address}</p>
      </div>

      {/* Resource controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="v2-card p-4 space-y-3"><Heart size={18} className="text-ok-400"/><div className="flex items-center justify-between gap-2"><strong className="text-xl font-mono">{info?.available_icu ?? '—'}</strong><div className="stepper"><button aria-label="Decrease ICU beds" onClick={()=>updateResource({available_icu:Math.max(0,(info?.available_icu??0)-1)})}><Minus size={14}/></button><button aria-label="Increase ICU beds" onClick={()=>updateResource({available_icu:(info?.available_icu??0)+1})}><Plus size={14}/></button></div></div><div className="text-[11px] uppercase tracking-wide opacity-60">Available ICU Beds</div></div>
        <div className="v2-card p-4 space-y-3"><Shield size={18} className="text-warn-300"/><div className="text-xl font-mono">{info?.trauma_level ?? 'Tier 1'}</div><div className="text-[11px] uppercase tracking-wide opacity-60">Trauma Level</div></div>
        <div className="v2-card p-4 space-y-3"><Activity size={18} className={info?.verified ? 'text-ok-400':'text-sos-300'}/><button className={`status-switch ${info?.emergency_status==='ONLINE' ? 'on':''}`} onClick={()=>updateResource({emergency_status:info?.emergency_status==='ONLINE'?'OFFLINE':'ONLINE',verified:info?.emergency_status==='ONLINE'?false:true})} aria-pressed={info?.emergency_status==='ONLINE'}><span/>{info?.emergency_status==='ONLINE'?'Operational':'Offline'}</button><div className="text-[11px] uppercase tracking-wide opacity-60">ER Status</div></div>
        <div className="v2-card p-4 space-y-3"><HospitalIcon size={18} className="text-info-300"/><div className="text-xl font-mono">{info?.available_beds ?? '—'}</div><div className="text-[11px] uppercase tracking-wide opacity-60">Available Beds</div></div>
      </div>

      {/* Capabilities */}
      {info?.capabilities && (
        <div className="v2-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Available Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {info.capabilities.split(',').map((cap, i) => (
              <span key={i} className="badge-blue text-xs px-2.5 py-1 rounded font-mono">{cap.trim()}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
