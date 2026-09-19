"use client";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle, Clock, Hospital as HospitalIcon, RefreshCw, MapPin, Mic, PlayCircle } from "lucide-react";
import api from "@/lib/api";
import { formatEnum } from "@/lib/format";
import { EmergencyCase, Hospital as HospitalType } from "@/types";

export default function HospitalDashboard() {
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);
  const [hospitalId, setHospitalId] = useState<number>(Number(typeof window !== "undefined" ? localStorage.getItem("emefast_hospital_id") || "2" : "2"));
  const [inboxCases, setInboxCases] = useState<EmergencyCase[]>([]);
  const [hospitalInfo, setHospitalInfo] = useState<HospitalType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedForReject, setSelectedForReject] = useState<EmergencyCase | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Required Specialist Unavailable");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    api.get("/hospitals").then(r => setHospitals(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("emefast_hospital_id", String(hospitalId));
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, [hospitalId]);

  const fetchData = async () => {
    try {
      const [infoRes, inboxRes] = await Promise.all([
        api.get(`/hospitals/${hospitalId}`),
        api.get(`/hospitals/${hospitalId}/incoming`),
      ]);
      setHospitalInfo(infoRes.data);
      setInboxCases(inboxRes.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const respond = async (c: EmergencyCase, response: "ACCEPTED" | "REJECTED") => {
    if (response === "REJECTED" && !rejectionReason.trim()) return;
    setProcessingId(c.id);
    try {
      await api.post(`/hospitals/${hospitalId}/respond/${c.id}`, {
        response,
        eta: response === "ACCEPTED" ? Math.max(2, Math.round((c.responses?.find(r => r.hospital_id === hospitalId)?.eta || 8) * 10) / 10) : undefined,
        rejection_reason: response === "REJECTED" ? rejectionReason.trim() : undefined,
      });
      setSelectedForReject(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Could not update the hospital response.");
    } finally { setProcessingId(null); }
  };

  return (
    <div className="hospital-shell">
      <section className="hospital-hero glass-panel">
        <div>
          <div className="eyebrow"><Activity size={12}/> VERIFIED ER DESK · LIVE INBOX</div>
          <h1>Emergency Case Intake</h1>
          <p>Every emergency query sent to this facility appears here. Review the full assessment and respond without leaving the case.</p>
        </div>
        <div className="hospital-tools">
          <label className="hospital-picker"><span>Facility</span><select value={hospitalId} onChange={e => setHospitalId(Number(e.target.value))}>{hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
          <div className="hospital-metric"><span>ICU AVAILABLE</span><strong>{hospitalInfo?.available_icu ?? "—"}</strong></div>
          <button className="sync-button" onClick={fetchData}><RefreshCw size={14}/> Sync</button>
        </div>
      </section>

      <section className="inbox-head">
        <div><span className="live-dot"/> <strong>Incoming Emergency Queries</strong> <b>{inboxCases.length}</b></div>
        <span>Updates automatically every 2.5s</span>
      </section>

      {loading ? <div className="hospital-empty glass-panel"><RefreshCw className="spin" size={24}/><span>Connecting to emergency network…</span></div> : inboxCases.length === 0 ? (
        <div className="hospital-empty glass-panel"><CheckCircle2 size={30}/><h3>Inbox clear</h3><p>New emergency queries will appear here automatically.</p></div>
      ) : (
        <div className="hospital-case-list">
          {inboxCases.map(c => {
            const myResponse = c.responses?.find(r => r.hospital_id === hospitalId);
            const isPending = myResponse?.response === "PENDING";
            return <article key={c.id} className={`hospital-case glass-panel ${c.priority === "CRITICAL" ? "critical-case" : ""}`}>
              <div className="hospital-case-top"><div className="case-id"><span>{c.case_code}</span><em>{formatEnum(c.priority)}</em><small>{new Date(c.created_at).toLocaleTimeString()}</small></div><div className={`response-state ${myResponse?.response?.toLowerCase()}`}>{myResponse?.response === "ACCEPTED" ? "ACCEPTED" : myResponse?.response === "REJECTED" ? "REJECTED" : "ACTION REQUIRED"}</div></div>
              <div className="hospital-case-grid">
                <div><label>PATIENT</label><strong>{c.patient_name} {c.patient_age ? `· ${c.patient_age}y` : ""}</strong><p>{c.condition}</p></div>
                <div><label>REQUIREMENTS</label><strong>{c.requirements || "Emergency stabilization"}</strong><p>{c.vitals || "Vitals not provided"}</p></div>
                <div><label>LOCATION</label><strong><MapPin size={13}/> {c.address || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}</strong><p>{formatEnum(c.transport_mode)}</p></div>
              </div>
              {c.voice_note_path && <div className="hospital-voice"><Mic size={14}/><span>Voice assessment attached</span><audio controls preload="none" src={`${(api.defaults.baseURL || '').replace(/\/api$/, '')}${c.voice_note_path}`}/></div>}
              <div className="hospital-case-bottom"><span>{myResponse?.eta ? `Estimated ETA ${Math.round(myResponse.eta)} min` : "ETA calculated from case location"}</span><div>{isPending && <><button className="reject-btn" disabled={processingId===c.id} onClick={() => setSelectedForReject(c)}><XCircle size={15}/> Decline</button><button className="accept-btn" disabled={processingId===c.id} onClick={() => respond(c,"ACCEPTED")}><CheckCircle2 size={15}/> Accept Emergency</button></>}{myResponse?.response === "ACCEPTED" && <span className="accepted-confirm"><CheckCircle2 size={15}/> Case accepted — patient can compare this facility</span>}</div></div>
            </article>
          })}
        </div>
      )}

      {selectedForReject && <div className="modal-backdrop"><div className="reject-modal glass-panel"><div className="eyebrow"><XCircle size={13}/> DECLINE CASE {selectedForReject.case_code}</div><h3>Why can this ER not accept?</h3><div className="reason-list">{["Required Specialist Unavailable","ICU Bed Capacity Full","Oxygen Supply Constraints","Emergency Department Maintenance"].map(r=><button key={r} className={rejectionReason===r?"selected":""} onClick={()=>setRejectionReason(r)}>{r}</button>)}</div><div className="modal-actions"><button onClick={()=>setSelectedForReject(null)}>Cancel</button><button className="reject-btn" onClick={()=>respond(selectedForReject,"REJECTED")} disabled={processingId===selectedForReject.id}>Confirm Decline</button></div></div></div>}
    </div>
  );
}
