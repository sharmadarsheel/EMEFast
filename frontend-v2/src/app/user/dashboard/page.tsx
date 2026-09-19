"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Hospital as HospitalIcon, MapPin, Navigation, Radio, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import api from '@/lib/api';
import { formatEnum } from '@/lib/format';
import { DecisionEngineResult, EmergencyCase } from '@/types';
import LiveMap from '@/components/LiveMap';

export default function UserDashboard() {
  const [activeCase, setActiveCase] = useState<EmergencyCase | null>(null);
  const [recentCases, setRecentCases] = useState<EmergencyCase[]>([]);
  const [decision, setDecision] = useState<DecisionEngineResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get('/emergency/active/current'),
        api.get('/emergency/history/all'),
      ]);
      const active = activeRes.data as EmergencyCase | null;
      setActiveCase(active);
      setRecentCases((historyRes.data || []).slice(0, 6));
      if (active) {
        try {
          const rec = await api.get(`/emergency/${active.id}/recommendation`);
          setDecision(rec.data);
        } catch { setDecision(null); }
      } else setDecision(null);
    } catch {}
    finally { setLoading(false); }
  };

  const accepted = decision?.accepted_count ?? activeCase?.responses?.filter(r => r.response === 'ACCEPTED').length ?? 0;
  const total = decision?.total_evaluated ?? activeCase?.responses?.length ?? 0;
  const recommended = decision?.recommended_hospital || null;

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow red"><span className="status-dot" /> AMBULANCE COORDINATION</div>
          <h1>Every second matters.</h1>
          <p>One ambulance case. Multiple hospitals. Compare accepted options by clinical fit, ETA and estimated cost.</p>
        </div>
        <Link href="/ambulance/emergency/new" className="dashboard-primary"><AlertTriangle size={16} /> New emergency <ArrowRight size={15} /></Link>
      </section>

      {loading ? (
        <div className="dashboard-empty"><Radio className="spin" size={24} /><span>Connecting to hospital response network…</span></div>
      ) : activeCase ? (
        <>
          <section className="dashboard-stats">
            <div className="stat-card stat-red"><span>ACTIVE CASE</span><strong>{activeCase.case_code}</strong><small>{formatEnum(activeCase.priority)} priority</small></div>
            <div className="stat-card stat-blue"><span>HOSPITALS RESPONDED</span><strong>{accepted} / {total || '—'}</strong><small>accepted responses</small></div>
            <div className="stat-card stat-green"><span>BEST OVERALL</span><strong>{recommended?.hospital_name || 'Awaiting'}</strong><small>{recommended ? `₹${recommended.estimated_cost.toLocaleString()} · ${Math.round(recommended.eta)} min` : 'Waiting for acceptance'}</small></div>
            <div className="stat-card stat-amber"><span>FASTEST</span><strong>{decision?.fastest_hospital ? `${Math.round(decision.fastest_hospital.eta)} min` : '—'}</strong><small>{decision?.fastest_hospital ? decision.fastest_hospital.hospital_name : 'No accepted route yet'}</small></div>
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-main-column">
              <article className="dashboard-case-card glass-panel">
                <div className="case-topline">
                  <div className="case-title-wrap">
                    <span className="live-badge"><span /> LIVE CASE</span>
                    <span className="case-code">{activeCase.case_code}</span>
                    <span className={`severity-badge ${activeCase.priority === 'CRITICAL' ? 'critical' : ''}`}>{formatEnum(activeCase.priority)}</span>
                  </div>
                  <span className="case-status">{formatEnum(activeCase.status)}</span>
                </div>
                <h2>{activeCase.patient_name} <span>· {activeCase.condition}</span></h2>
                <div className="case-meta"><span><ShieldCheck size={13} /> {activeCase.requirements || 'Emergency stabilization'}</span><span><Navigation size={13} /> {formatEnum(activeCase.transport_mode)}</span></div>
                <div className="case-metrics">
                  <div><span>RESPONSES</span><strong>{accepted}/{total || '—'}</strong></div>
                  <div><span>ACCEPTED</span><strong>{accepted}</strong></div>
                  <div><span>BEST ETA</span><strong>{recommended ? `${Math.round(recommended.eta)} min` : '—'}</strong></div>
                  <div><span>EST. COST</span><strong>{recommended ? `₹${recommended.estimated_cost.toLocaleString()}` : '—'}</strong></div>
                </div>
                <div className="case-actions">
                  <Link href={`/user/hospitals?case_id=${activeCase.id}`} className="soft-button"><HospitalIcon size={15} /> Compare hospitals</Link>
                  <Link href={activeCase.selected_hospital ? `/user/navigation?case_id=${activeCase.id}` : `/user/hospitals?case_id=${activeCase.id}`} className="blue-button"><Navigation size={15} /> {activeCase.selected_hospital ? 'Track route' : 'View responses'}</Link>
                </div>
              </article>

              <article className="glass-panel dashboard-map-panel">
                <div className="panel-heading"><div><span className="eyebrow"><MapPin size={12} /> LIVE LOCATION & ROUTE</span><h3>{activeCase.selected_hospital?.name || recommended?.hospital_name || 'Waiting for hospital selection'}</h3></div><span className="map-live-pill"><span /> GPS / MAP</span></div>
                <LiveMap
                  origin={{ lat: activeCase.latitude, lng: activeCase.longitude }}
                  destination={activeCase.selected_hospital ? { lat: activeCase.selected_hospital.latitude, lng: activeCase.selected_hospital.longitude } : recommended ? { lat: recommended.latitude, lng: recommended.longitude } : null}
                  destinationLabel={activeCase.selected_hospital?.name || recommended?.hospital_name || 'Hospital'}
                  onRouteInfo={setRouteInfo}
                />
                <div className="map-footer"><span><span className="gps-dot" /> Actual browser GPS when permission is available</span><span>{routeInfo ? `${routeInfo.distanceKm.toFixed(1)} km · ${routeInfo.durationMin} min` : 'Route appears after a hospital is selected'}</span></div>
              </article>
            </div>

            <aside className="dashboard-side-column">
              <article className="glass-panel recommendation-card">
                <div className="eyebrow"><Sparkles size={12} /> HOSPITAL INTELLIGENCE</div>
                {recommended ? (
                  <>
                    <div className="recommendation-badge"><Zap size={13} /> BEST OVERALL</div>
                    <h3>{recommended.hospital_name}</h3>
                    <p><MapPin size={12} /> {recommended.hospital_address}</p>
                    <div className="recommendation-numbers"><div><span>ETA</span><strong>{Math.round(recommended.eta)}m</strong></div><div><span>DISTANCE</span><strong>{recommended.distance_km.toFixed(1)} km</strong></div><div><span>COST</span><strong>₹{recommended.estimated_cost.toLocaleString()}</strong></div></div>
                    <p className="accepted-note"><CheckCircle2 size={14} /> Accepted · {recommended.available_icu} ICU beds</p>
                    <Link href={`/user/hospitals?case_id=${activeCase.id}`} className="full-button">Compare all accepted options <ArrowRight size={14} /></Link>
                  </>
                ) : <div className="waiting-box"><Clock3 size={18} /><strong>Waiting for acceptance</strong><span>Hospital responses will appear here in real time.</span></div>}
              </article>

              <article className="glass-panel recent-panel">
                <div className="panel-heading"><h3>Recent cases</h3><Link href="/user/history">History →</Link></div>
                <div className="recent-list">{recentCases.map(c => <Link key={c.id} href={`/user/hospitals?case_id=${c.id}`} className="recent-row"><span className={`recent-severity ${c.priority === 'CRITICAL' ? 'critical' : ''}`} /> <div><strong>{c.case_code}</strong><span>{c.patient_name} · {formatEnum(c.status)}</span></div><ArrowRight size={14} /></Link>)}</div>
              </article>
            </aside>
          </section>
        </>
      ) : (
        <div className="dashboard-empty empty-large"><div className="empty-icon"><HeartPulseIcon /></div><h2>No active emergency</h2><p>Create an emergency to broadcast a structured case to verified hospitals and compare their responses.</p><Link href="/ambulance/emergency/new" className="dashboard-primary"><AlertTriangle size={16} /> Create emergency</Link></div>
      )}
    </div>
  );
}

function HeartPulseIcon() { return <span className="heart-placeholder">♥</span>; }
