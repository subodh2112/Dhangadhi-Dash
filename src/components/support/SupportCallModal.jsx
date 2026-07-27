import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Loader2, Clock, User } from "lucide-react";
import { startSupportCall, endSupportCall } from "@/lib/support";
import { initiateCall, endCall, toggleMute } from "@/lib/webrtc";
import { base44 } from "@/api/base44Client";

export default function SupportCallModal({ user, userType, orderContext, onClose }) {
  const [callId, setCallId] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [queuePos, setQueuePos] = useState(0);
  const [estWait, setEstWait] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const callIdRef = useRef(null);

  const statusLabels = {
    connecting: "Connecting...",
    ringing: "Ringing...",
    connected: "Connected",
    ended: "Call Ended",
    queued: "In Queue",
  };

  const statusColors = {
    connecting: "bg-amber-500",
    ringing: "bg-blue-500",
    connected: "bg-terai",
    ended: "bg-foreground/30",
    queued: "bg-saffron",
  };

  useEffect(() => {
    let unsub = null;
    const init = async () => {
      const result = await startSupportCall(user, userType, orderContext);
      if (!result.success) { setError(result.error || "Failed to start call"); setStatus("ended"); return; }
      setCallId(result.call.id);
      callIdRef.current = result.call.id;
      setQueuePos(result.call.queue_position || 1);
      setEstWait(result.call.estimated_wait_seconds || 45);
      setStatus("connecting");

      // Initiate WebRTC call — creates offer and stores it in the entity
      try {
        const webrtc = await initiateCall(result.call.id, {
          onRemoteStream: (stream) => {
            if (audioRef.current) audioRef.current.srcObject = stream;
          },
          onConnected: () => {
            setStatus("connected");
            setEstWait(0);
            timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
          },
          onError: (err) => {
            setError(err);
          },
        });
        pcRef.current = webrtc.pc;
        streamRef.current = webrtc.localStream;
        setStatus("ringing");
      } catch (e) {
        setError(e.message || "Failed to connect audio");
      }

      // Subscribe for end/missed/cancelled status changes
      unsub = base44.entities.SupportCall.subscribe((event) => {
        if (event.data?.id === callIdRef.current) {
          const newStatus = event.data?.status;
          if (newStatus === "ended" || newStatus === "missed" || newStatus === "cancelled") {
            setStatus("ended");
            if (timerRef.current) clearInterval(timerRef.current);
            endCall(pcRef.current);
          }
        }
      });
    };
    init();
    return () => {
      if (unsub) unsub();
      if (timerRef.current) clearInterval(timerRef.current);
      endCall(pcRef.current);
      if (callIdRef.current) endSupportCall(callIdRef.current, "caller_cancelled").catch(() => {});
    };
  }, []);

  const handleEnd = async () => {
    if (callIdRef.current) await endSupportCall(callIdRef.current, "caller_ended").catch(() => {});
    if (timerRef.current) clearInterval(timerRef.current);
    endCall(pcRef.current);
    setStatus("ended");
    setTimeout(onClose, 1500);
  };

  const handleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    toggleMute(streamRef.current, newMuted);
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ":" + sec.toString().padStart(2, "0");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-carbon/80 backdrop-blur-md" onClick={status === "ended" ? onClose : undefined} />
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          className="relative bg-card rounded-3xl border border-border p-8 max-w-xs w-full text-center"
        >
          <audio ref={audioRef} autoPlay />
          {error ? (
            <>
              <p className="text-sm text-red-500 mb-4">{error}</p>
              <button onClick={onClose} className="w-full h-11 rounded-xl bg-muted text-foreground font-bold">Close</button>
            </>
          ) : (
            <>
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className={"absolute inset-0 rounded-full flex items-center justify-center " + statusColors[status] + "/10"}>
                  <div className={"w-20 h-20 rounded-full flex items-center justify-center " + statusColors[status]}>
                    {status === "connected" ? <Mic className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-white" />}
                  </div>
                </div>
                {(status === "connecting" || status === "ringing" || status === "queued") && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-saffron/40 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-2 border-saffron/20 animate-pulse" />
                  </>
                )}
              </div>

              <p className="font-display font-bold text-lg text-foreground mb-1">Dhangadhi Dash Support</p>
              <p className="text-sm font-semibold capitalize mb-1" style={{ color: status === "connected" ? "hsl(var(--terai))" : status === "ended" ? "hsl(var(--muted-foreground))" : "hsl(var(--saffron))" }}>
                {statusLabels[status]}
              </p>

              {(status === "ringing" || status === "queued") && (
                <div className="mb-4 space-y-1">
                  <p className="text-xs text-foreground/50 flex items-center justify-center gap-1"><User className="w-3 h-3" /> Queue position: <b className="text-foreground">{queuePos}</b></p>
                  <p className="text-xs text-foreground/50 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Est. wait: <b className="text-foreground">~{Math.ceil(estWait / 60)} min</b></p>
                </div>
              )}

              {status === "connected" && (
                <p className="text-2xl font-mono font-bold text-terai mb-4">{fmtTime(duration)}</p>
              )}

              {status === "ended" && (
                <p className="text-sm text-foreground/40 mb-4">Thank you for contacting support.</p>
              )}

              {status !== "ended" && (
                <div className="flex items-center justify-center gap-4 mt-2">
                  {status === "connected" && (
                    <button
                      onClick={handleMute}
                      className={"w-12 h-12 rounded-full flex items-center justify-center transition-colors " + (muted ? "bg-red-500 text-white" : "bg-muted text-foreground")}
                    >
                      {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}
                  <button
                    onClick={handleEnd}
                    className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    {status === "connecting" ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-6 h-6" />}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}