"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, AlertTriangle, ArrowRight, Car, Check, CheckCircle2, ChevronRight,
  Crosshair, FileText, HeartPulse, Loader2, MapPin, Mic, MicOff,
  Navigation, ShieldCheck, Sparkles, Square, Stethoscope, User, Volume2,
  X, Zap,
} from "lucide-react";
import api from "@/lib/api";
import LiveMap from "@/components/LiveMap";

const SEVERITIES = [
  { id: "LOW", label: "Mild", detail: "Stable / minor injury" },
  { id: "MEDIUM", label: "Moderate", detail: "Needs medical review" },
  { id: "HIGH", label: "Serious", detail: "Fracture / heavy bleeding" },
  { id: "CRITICAL", label: "Critical", detail: "Life-threatening" },
] as const;

const NEEDS = [
  "ICU", "Ventilator", "Oxygen", "Cardiologist", "Neurosurgeon",
  "Trauma surgeon", "Orthopedic", "Emergency surgery", "Pediatric care",
  "Maternity / OB-GYN",
];

const CONDITIONS = [
  "Chest pain", "Difficulty breathing", "Stroke symptoms", "Unconscious",
  "Accident / Trauma", "Severe bleeding", "Seizure", "Severe burns",
];

type Severity = (typeof SEVERITIES)[number]["id"];
type Mode = "AMBULANCE" | "SELF_TRANSPORT";

type VoiceState = "idle" | "requesting" | "recording" | "stopping" | "ready" | "error";

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function VoiceRecorder({
  onRecording,
  onTranscript,
}: {
  onRecording: (blob: Blob | null) => void;
  onTranscript: (text: string) => void;
}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [language, setLanguage] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [transcribing, setTranscribing] = useState(false);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mime, setMime] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    speechRef.current = null;
    setTranscribing(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
    };
  }, [cleanup]);

  const startSpeech = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return;
    const run = () => {
      if (recorderRef.current?.state !== "recording") return;
      try {
        const recognition = new Recognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => setTranscribing(true);
        recognition.onend = () => {
          setTranscribing(false);
          if (recorderRef.current?.state === "recording") window.setTimeout(run, 120);
        };
        recognition.onerror = () => {
          setTranscribing(false);
          if (recorderRef.current?.state === "recording") window.setTimeout(run, 250);
        };
        recognition.onresult = (event: any) => {
          const parts: string[] = [];
          for (let i = 0; i < event.results.length; i += 1) {
            const text = event.results[i]?.[0]?.transcript?.trim();
            if (text) parts.push(text);
          }
          if (parts.length) {
            const chunk = parts.join(" ").trim();
            transcriptRef.current = [transcriptRef.current, chunk].filter(Boolean).join(" ");
            onTranscript(transcriptRef.current);
          }
        };
        speechRef.current = recognition;
        recognition.start();
      } catch {
        setTranscribing(false);
      }
    };
    run();
  };

  const start = async () => {
    if (state === "recording" || state === "requesting") return;
    setMessage("");
    // A new recording always starts a fresh session. Clear the previous
    // local blob/transcript immediately so an old recording can never be
    // accidentally submitted with the new case.
    onRecording(null);
    transcriptRef.current = "";
    onTranscript("");
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    setState("requesting");

    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
      setState("error");
      setMessage("Microphone access requires HTTPS. Open the deployed HTTPS URL or localhost.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("error");
      setMessage("This browser does not support voice recording. Try the latest Safari, Chrome or Edge.");
      return;
    }

    const selectedMime = pickMimeType();
    if (!selectedMime) {
      setState("error");
      setMessage("No supported audio recording format was found on this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      transcriptRef.current = "";
      onTranscript("");
      setMime(selectedMime);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });

      const recorder = new MediaRecorder(stream, { mimeType: selectedMime });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        cleanup();
        setState("error");
        setMessage("The browser stopped the recording unexpectedly. Please try again.");
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || selectedMime });
        cleanup();
        if (!blob.size) {
          setState("error");
          setMessage("No audio was captured. Check microphone permission and try again.");
          onRecording(null);
          return;
        }
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onRecording(blob);
        setState("ready");
      };

      recorderRef.current = recorder;
      recorder.start(500);
      setSeconds(0);
      setState("recording");
      if (navigator.vibrate) navigator.vibrate(30);
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
      startSpeech();
    } catch (error: any) {
      cleanup();
      setState("error");
      if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
        setMessage("Microphone permission was denied. Allow microphone access in your browser settings and try again.");
      } else if (error?.name === "NotFoundError") {
        setMessage("No microphone was found. Connect a microphone and try again.");
      } else {
        setMessage("Could not start the microphone. Please try again.");
      }
    }
  };

  const stop = () => {
    if (!recorderRef.current || recorderRef.current.state !== "recording") return;
    setState("stopping");
    speechRef.current?.stop?.();
    try { recorderRef.current.requestData(); } catch {}
    recorderRef.current.stop();
    if (navigator.vibrate) navigator.vibrate([50, 40, 50]);
  };

  const discard = () => {
    speechRef.current?.stop?.();
    cleanup();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    transcriptRef.current = "";
    onTranscript("");
    setSeconds(0);
    setState("idle");
    setMessage("");
    onRecording(null);
  };

  return (
    <section className="liquid-card voice-card">
      <div className="section-heading">
        <div>
          <div className="eyebrow"><Mic size={12} /> VOICE NOTE</div>
          <h2>Tell hospitals what is happening</h2>
          <p>Record the patient's condition. The audio is attached to this emergency case.</p>
        </div>
        <div className={`voice-orb ${state === "recording" ? "is-recording" : ""}`} aria-hidden="true">
          {state === "recording" ? <Mic size={22} /> : <Volume2 size={22} />}
        </div>
      </div>

      <div className="voice-controls">
        <div className="voice-language" aria-label="Transcription language">
          <span>Transcript</span>
          <button type="button" disabled={state === "recording" || state === "stopping"} className={language === "hi-IN" ? "active" : ""} onClick={() => setLanguage("hi-IN")}>हिन्दी</button>
          <button type="button" disabled={state === "recording" || state === "stopping"} className={language === "en-IN" ? "active" : ""} onClick={() => setLanguage("en-IN")}>English</button>
        </div>
        <div className="voice-action-row">
          {state === "recording" || state === "stopping" ? (
            <button type="button" className="record-button recording" onClick={stop} disabled={state === "stopping"} aria-label="Stop recording">
              {state === "stopping" ? <Loader2 className="spin" size={19} /> : <Square size={17} fill="currentColor" />}
              <span>{state === "stopping" ? "Saving…" : `Stop ${formatTime(seconds)}`}</span>
            </button>
          ) : (
            <button type="button" className="record-button" onClick={start} aria-label="Start voice recording">
              <Mic size={19} />
              <span>{state === "ready" ? "Replace recording" : "Start recording"}</span>
            </button>
          )}
          {state === "ready" && (
            <button type="button" className="icon-button" onClick={discard} aria-label="Discard recording"><X size={17} /></button>
          )}
        </div>
      </div>

      {state === "recording" && (
        <div className="recording-status" role="status">
          <span className="live-dot" /> Recording locally · {transcribing ? "transcribing" : "audio capture active"} · {mime.replace(";codecs=opus", "")}
        </div>
      )}

      {state === "ready" && previewUrl && (
        <div className="audio-preview">
          <CheckCircle2 size={17} />
          <div className="audio-preview-main">
            <strong>Voice note ready</strong>
            <audio controls preload="metadata" src={previewUrl} />
          </div>
        </div>
      )}

      {message && <div className="inline-error" role="alert"><AlertCircle size={16} /><span>{message}</span></div>}
      <div className="voice-footnote"><ShieldCheck size={13} /> Recording stays on this device until you submit the case.</div>
    </section>
  );
}

export default function CreateEmergencyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("AMBULANCE");
  const [priority, setPriority] = useState<Severity>("HIGH");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [condition, setCondition] = useState("");
  const [requirements, setRequirements] = useState<string[]>(["Emergency stabilization"]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState("Location not locked");
  const [gpsState, setGpsState] = useState<"idle" | "locating" | "locked" | "error">("idle");
  const [gpsMessage, setGpsMessage] = useState("");
  const [gpsPermission, setGpsPermission] = useState<"prompt" | "granted" | "denied" | "unknown">("unknown");
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const sosTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const gpsTimeoutRef = useRef<ReturnType<typeof setTimeout> | number | null>(null);

  const detectGPS = useCallback(() => {
    if (gpsWatchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(gpsWatchRef.current);
    gpsWatchRef.current = null;
    if (gpsTimeoutRef.current) clearTimeout(gpsTimeoutRef.current);
    gpsTimeoutRef.current = null;
    setGpsState("locating");
    setGpsMessage("");

    if (!navigator.geolocation) {
      setGpsState("error");
      setGpsMessage("Location is not supported by this browser.");
      return;
    }
    if (!window.isSecureContext && !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
      setGpsState("error");
      setGpsMessage("Browser location requires HTTPS. Open EMEFast over HTTPS or localhost.");
      return;
    }

    let settled = false;
    let bestAccuracy = Number.POSITIVE_INFINITY;

    const finish = () => {
      if (gpsTimeoutRef.current) clearTimeout(gpsTimeoutRef.current);
      gpsTimeoutRef.current = null;
    };

    const acceptPosition = (pos: GeolocationPosition) => {
      if (settled) return;
      const nextAccuracy = Number(pos.coords.accuracy);
      if (!Number.isFinite(nextAccuracy)) return;
      bestAccuracy = Math.min(bestAccuracy, nextAccuracy);
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      setAccuracy(nextAccuracy);
      settled = true;

      // Desktop browsers often return Wi-Fi/network positioning rather than a GPS chip fix.
      // Always show the real browser result and label its accuracy honestly; never inject a demo landmark.
      if (nextAccuracy <= 100) {
        setAddress(`Device location detected · ±${Math.round(nextAccuracy)} m`);
        setGpsMessage("");
      } else {
        setAddress(`Device location detected · approximate ±${Math.round(nextAccuracy)} m`);
        setGpsMessage(`Desktop location is approximate (±${Math.round(nextAccuracy)} m). The detected device location is shown on the map.`);
      }
      setGpsState("locked");
      finish();
    };

    const fallbackToStandardLocation = () => {
      if (settled) return;
      navigator.geolocation.getCurrentPosition(acceptPosition, onError, {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 30000,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      if (settled) return;
      if (err.code === 1) {
        setGpsState("error");
        setGpsMessage("Location permission is blocked. Allow location for this site in Chrome/Edge and enable Windows Location Services, then tap Refresh Location.");
        finish();
        return;
      }
      // High-accuracy mode can time out on desktops without a GPS sensor. Retry using the browser's
      // normal network/Wi-Fi location provider instead of failing the whole flow.
      if (!bestAccuracy || bestAccuracy === Number.POSITIVE_INFINITY) {
        fallbackToStandardLocation();
        return;
      }
      setGpsState("error");
      setGpsMessage("Could not detect device location. Check Windows Location Services and try Refresh Location again.");
      finish();
    };

    try {
      navigator.permissions?.query({ name: "geolocation" as PermissionName }).then((permission) => {
        setGpsPermission(permission.state as any);
        permission.onchange = () => setGpsPermission(permission.state as any);
      }).catch(() => {});
    } catch {}

    // Try precise device positioning first, then automatically fall back to the standard desktop
    // location provider if the machine has no GPS hardware or the precise provider times out.
    navigator.geolocation.getCurrentPosition(acceptPosition, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    gpsTimeoutRef.current = window.setTimeout(() => {
      if (!settled) fallbackToStandardLocation();
    }, 10500);
  }, []);

  useEffect(() => {
    detectGPS();
    return () => {
      if (gpsWatchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(gpsWatchRef.current);
      if (gpsTimeoutRef.current) clearTimeout(gpsTimeoutRef.current);
      if (sosTimer.current) clearInterval(sosTimer.current);
    };
  }, [detectGPS]);

  const toggleNeed = (need: string) => {
    setRequirements((current) => current.includes(need) ? current.filter((item) => item !== need) : [...current.filter((item) => item !== "Emergency stabilization"), need]);
  };

  const appendCondition = (value: string) => {
    setCondition((current) => current ? `${current}${current.endsWith(".") ? " " : ", "}${value}` : value);
  };

  const openCase = async (oneTap = false) => {
    setError("");
    setSuccess("");
    if (lat == null || lng == null) {
      setError("Device location is required. Tap Refresh Location and allow location access.");
      detectGPS();
      return;
    }
    if (!oneTap && !condition.trim() && !voiceBlob) {
      setError("Describe the emergency or record a voice note before sending the hospital query.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/emergency/new", {
        patient_name: name.trim() || "Unknown Patient",
        patient_age: age ? Number(age) : undefined,
        transport_mode: mode,
        condition: condition.trim() || "Emergency — details pending",
        priority,
        requirements: requirements.length ? requirements.join(", ") : "Emergency stabilization",
        latitude: lat,
        longitude: lng,
        address,
        voice_transcript: voiceText.trim() || undefined,
      });

      const caseId = res.data.id;
      if (typeof window !== "undefined") {
        localStorage.setItem("emefast_current_case_id", String(caseId));
      }

      let voiceUploadFailed = false;
      if (voiceBlob?.size) {
        try {
          await api.post(`/emergency/${caseId}/voice-note`, voiceBlob, {
            headers: {
              "Content-Type": voiceBlob.type || "audio/webm",
              ...(voiceText.trim() ? { "x-voice-transcript": voiceText.slice(0, 10000) } : {}),
            },
            maxBodyLength: 15 * 1024 * 1024,
            timeout: 30000,
          });
        } catch {
          voiceUploadFailed = true;
        }
      }

      setSuccess(voiceUploadFailed
        ? "Emergency case opened. Hospital query is live; voice upload needs a retry."
        : "Emergency case opened. Hospital queries are now live and the voice note was attached.");

      // Clean up old recording and form state immediately upon submit
      setVoiceBlob(null);
      setVoiceText("");
      setName("");
      setAge("");
      setCondition("");

      setTimeout(() => router.push(`/user/hospitals?case_id=${caseId}`), 400);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not open the emergency case. Please try again.");
      setSubmitting(false);
    }
  };

  const startSOS = () => {
    if (submitting || sosTimer.current) return;
    setError("");
    setSosProgress(0);
    const started = Date.now();
    sosTimer.current = setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / 3000);
      setSosProgress(progress);
      if (progress >= 1) {
        if (sosTimer.current) clearInterval(sosTimer.current);
        sosTimer.current = null;
        if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
        openCase(true);
      }
    }, 40);
  };

  const cancelSOS = () => {
    if (sosTimer.current) clearInterval(sosTimer.current);
    sosTimer.current = null;
    setSosProgress(0);
  };

  return (
    <main className="emergency-shell">
      <div className="ambient ambient-red" />
      <div className="ambient ambient-white" />

      <header className="emergency-header">
        <div>
          <div className="eyebrow"><HeartPulse size={12} /> EMEFAST AI · EMERGENCY COORDINATION</div>
          <h1>Find the right hospital.<br /><span>Before you arrive.</span></h1>
          <p>One case. Multiple hospitals. Compare accepted options by clinical fit, ETA and estimated cost.</p>
        </div>
        <div className={`location-pill ${gpsState === "locked" ? "locked" : ""}`}>
          <span className="status-dot" />
          {gpsState === "locked" ? "Location locked" : gpsState === "locating" ? "Locating…" : "Location needed"}
        </div>
      </header>

      <section className="sos-panel liquid-card">
        <div className="sos-copy">
          <div className="eyebrow red"><Zap size={12} /> HOLD TO OPEN CASE</div>
          <h2>Emergency SOS</h2>
          <p>Hold for 3 seconds. EMEFast will use your precise location and open a hospital query without requiring typing.</p>
        </div>
        <div className="sos-wrap">
          {sosProgress > 0 && sosProgress < 1 && <div className="sos-progress" style={{ background: `conic-gradient(#ff3b30 ${sosProgress * 360}deg, rgba(255,255,255,.08) 0deg)` }} />}
          <button
            type="button"
            className={`sos-core ${sosProgress > 0 ? "holding" : ""}`}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); startSOS(); }}
            onPointerUp={(event) => { event.currentTarget.releasePointerCapture?.(event.pointerId); cancelSOS(); }}
            onPointerCancel={(event) => { event.currentTarget.releasePointerCapture?.(event.pointerId); cancelSOS(); }}
            disabled={submitting}
            aria-label="Hold for three seconds to open emergency case"
          >
            <AlertTriangle size={27} />
            <strong>SOS</strong>
            <span>{sosProgress > 0 ? `${Math.ceil((1 - sosProgress) * 3)}s` : "HOLD"}</span>
          </button>
        </div>
      </section>

      {error && <div className="page-alert error"><AlertCircle size={17} /><span>{error}</span></div>}
      {success && <div className="page-alert success"><CheckCircle2 size={17} /><span>{success}</span></div>}

      <div className="workspace-grid">
        <div className="workspace-main">
          <VoiceRecorder onRecording={setVoiceBlob} onTranscript={(text) => setVoiceText((current) => current ? `${current} ${text}` : text)} />

          <section className="liquid-card">
            <div className="section-heading compact">
              <div>
                <div className="eyebrow"><Stethoscope size={12} /> PATIENT ASSESSMENT</div>
                <h2>What does the patient need?</h2>
                <p>Choose only what the coordinator can confidently assess. Hospitals receive this with the case.</p>
              </div>
            </div>

            <div className="severity-grid">
              {SEVERITIES.map((item) => (
                <button key={item.id} type="button" className={`severity ${priority === item.id ? "selected" : ""} ${item.id === "CRITICAL" ? "critical" : ""}`} onClick={() => setPriority(item.id)}>
                  <span className="severity-dot" />
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                  {priority === item.id && <Check size={14} />}
                </button>
              ))}
            </div>

            <div className="need-grid">
              {NEEDS.map((need) => (
                <button key={need} type="button" className={`need-chip ${requirements.includes(need) ? "selected" : ""}`} onClick={() => toggleNeed(need)}>
                  {requirements.includes(need) ? <Check size={13} /> : <span className="chip-plus">+</span>}
                  {need}
                </button>
              ))}
            </div>

            <div className="condition-box">
              <label><FileText size={13} /> Clinical summary</label>
              <textarea value={condition} onChange={(event) => setCondition(event.target.value)} placeholder="Example: Severe chest pain for 15 minutes, breathing difficulty, patient conscious." rows={4} />
              <div className="quick-tags">
                {CONDITIONS.map((item) => <button type="button" key={item} onClick={() => appendCondition(item)}>{item}</button>)}
              </div>
            </div>

            {(voiceText || voiceBlob) && (
              <div className="transcript-box">
                <div className="eyebrow"><Mic size={11} /> TRANSCRIPT · EDIT BEFORE SENDING</div>
                <textarea value={voiceText} onChange={(event) => setVoiceText(event.target.value)} placeholder="Speech transcript will appear here. You can correct names, symptoms or timing before sending." rows={4} />
              </div>
            )}
          </section>

          <div className="transport-section">
            <div className="eyebrow"><Car size={13} /> TRANSPORT MODE</div>
            <div className="transport-segment" role="group" aria-label="Transport mode">
              <button type="button" className={mode === "AMBULANCE" ? "selected" : ""} onClick={() => setMode("AMBULANCE")} aria-pressed={mode === "AMBULANCE"}>
                <Car size={17} /><span><strong>Ambulance</strong><small>Medical coordinator onboard</small></span>{mode === "AMBULANCE" && <Check size={15} />}
              </button>
              <button type="button" className={mode === "SELF_TRANSPORT" ? "selected" : ""} onClick={() => setMode("SELF_TRANSPORT")} aria-pressed={mode === "SELF_TRANSPORT"}>
                <Navigation size={17} /><span><strong>Self transport</strong><small>Private vehicle</small></span>{mode === "SELF_TRANSPORT" && <Check size={15} />}
              </button>
            </div>
          </div>

          <button type="button" className="details-toggle" onClick={() => setShowDetails((value) => !value)}>
            <span><User size={15} /> Patient & ambulance details</span>
            <ChevronRight size={16} className={showDetails ? "rotate-90" : ""} />
          </button>

          {showDetails && (
            <section className="liquid-card details-card animate-in">
              <div className="field-grid">
                <label>Patient name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" /></label>
                <label>Age<input type="number" min="0" max="120" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Optional" /></label>
              </div>
            </section>
          )}
        </div>

        <aside className="workspace-side">
          <section className="liquid-card location-card">
            <div className="side-title"><span><MapPin size={15} /> INCIDENT LOCATION</span><span className={`mini-status ${gpsState === "locked" ? "ok" : ""}`}>{gpsState === "locked" ? "LOCKED" : gpsState === "locating" ? "SEARCHING" : "NEEDED"}</span></div>
            {gpsState === "locked" && lat != null && lng != null ? (
              <div className="create-live-map">
                <LiveMap
                  origin={{ lat, lng }}
                  allowManualPick
                  onPickPosition={(point) => {
                    setLat(point.lat);
                    setLng(point.lng);
                    setAccuracy(null);
                    setAddress("Pinned incident location · verify before sending");
                    setGpsMessage("Map pin selected manually. Browser device GPS remains separate.");
                  }}
                />
              </div>
            ) : (
              <div className="map-placeholder"><div className="map-crosshair"><Crosshair size={20} /></div><div className="map-label">{gpsState === "locating" ? "Detecting device location…" : "Location unavailable"}</div></div>
            )}
            <div className="coordinates">{lat != null && lng != null ? `${lat.toFixed(5)}°, ${lng.toFixed(5)}°` : "—"}</div>
            <p>{address}</p>
            {accuracy != null && <small>Accuracy ±{Math.round(accuracy)} m{accuracy > 100 ? " · approximate device location" : " · precise device location"}</small>}
            {gpsPermission === "denied" && <div className="gps-error"><AlertCircle size={13} /> Location permission is blocked. Allow location for this site in Chrome/Edge and enable Windows Location Services, then refresh.</div>}
            {gpsMessage && <div className="gps-error"><AlertCircle size={13} /> {gpsMessage}</div>}
            <div className="location-actions">
              <button type="button" className="secondary-button" onClick={detectGPS} disabled={gpsState === "locating"}><Crosshair size={14} /> {gpsState === "locating" ? "Locating…" : "Refresh device location"}</button>
              <small className="location-hint">If Windows/Chrome reports an approximate location, tap the map to place the incident pin manually.</small>
            </div>
          </section>

          <section className="liquid-card recommendation-preview">
            <div className="eyebrow"><Sparkles size={12} /> AFTER YOU SUBMIT</div>
            <h3>Hospital Intelligence</h3>
            <div className="preview-row"><span>Clinical fit</span><strong>Required first</strong></div>
            <div className="preview-row"><span>Fastest option</span><strong>Lowest ETA</strong></div>
            <div className="preview-row"><span>Lowest estimated cost</span><strong>Compare ₹</strong></div>
            <div className="preview-row"><span>Best overall</span><strong>Explainable ranking</strong></div>
            <div className="side-note"><ShieldCheck size={14} /> Hospitals must accept the case before they can be recommended.</div>
          </section>

          <button type="button" className="primary-submit" disabled={submitting} onClick={() => openCase(false)}>
            {submitting ? <><Loader2 className="spin" size={18} /> Opening case…</> : <><ShieldCheck size={18} /> Open hospital query <ArrowRight size={17} /></>}
          </button>
          <p className="submit-note">This does not dispatch an ambulance. It sends the emergency case to eligible verified hospitals for acceptance.</p>
        </aside>
      </div>
    </main>
  );
}
