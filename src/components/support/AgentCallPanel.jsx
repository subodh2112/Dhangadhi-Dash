import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { answerCall, endCall, toggleMute } from "@/lib/webrtc";
import { endSupportCall } from "@/lib/support";

export default function AgentCallPanel({ callId, agent, callerName, callerType, onClose }) {
  const [status, setStatus] = useState("connecting");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const endedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const result = await answerCall(callId, agent, {
          onRemoteStream: (stream) => {
            if (audioRef.current) audioRef.current.srcObject = stream;
          },
          onConnected: () => {
            if (!mounted) return;
            setStatus("connected");
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
          },
          onError: (err) => {
            if (!mounted) return;
            setError(err);
            setStatus("ended");
          },
        });
        pcRef.current = result.pc;
        streamRef.current = result.localStream;
      } catch (e) {
        if (mounted) {
          setError(e.message || "Failed to answer call");
          setStatus("ended");
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      endCall(pcRef.current);
    };
  }, []);

  const handleEnd = async () => {
    endedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    endCall(pcRef.current);
    await endSupportCall(callId, "agent_ended").catch(() => {});
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
                <div className={"absolute inset-0 rounded-full flex items-center justify-center " + (status === "connected" ? "bg-terai/10" : "bg-saffron/10")}>
                  <div className={"w-20 h-20 rounded-full flex items-center justify-center " + (status === "connected" ? "bg-terai" : "bg-saffron")}>
                    {status === "connected" ? <Mic className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-white" />}
                  </div>
                </div>
                {status === "connecting" && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-saffron/40 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-2 border-saffron/20 animate-pulse" />
                  </>
                )}
              </div>

              <p className="font-display font-bold text-lg text-foreground mb-1">{callerName || "Incoming Call"}</p>
              <p className="text-xs text-foreground/40 capitalize mb-1">{callerType}</p>
              <p className="text-sm font-semibold capitalize mb-4" style={{ color: status === "connected" ? "hsl(var(--terai))" : "hsl(var(--saffron))" }}>
                {status === "connecting" ? "Connecting..." : status === "connected" ? "Connected" : "Call Ended"}
              </p>

              {status === "connected" && (
                <p className="text-2xl font-mono font-bold text-terai mb-4">{fmtTime(duration)}</p>
              )}

              {status === "ended" && (
                <p className="text-sm text-foreground/40 mb-4">Call ended.</p>
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