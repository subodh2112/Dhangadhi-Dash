import { base44 } from "@/api/base44Client";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function waitForIceGathering(pc) {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") {
      resolve();
      return;
    }
    const checkState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", checkState);
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", checkState);
      resolve();
    }, 3000);
  });
}

export async function initiateCall(callId, { onRemoteStream, onConnected, onError }) {
  const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const pc = new RTCPeerConnection(ICE_SERVERS);

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    if (event.streams[0]) onRemoteStream(event.streams[0]);
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "connected") onConnected();
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      onError("Connection lost");
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceGathering(pc);

  await base44.entities.SupportCall.update(callId, {
    sdp_offer: JSON.stringify(pc.localDescription),
  });

  const unsub = base44.entities.SupportCall.subscribe(async (event) => {
    if (event.data?.id === callId && event.data?.sdp_answer) {
      try {
        const answer = JSON.parse(event.data.sdp_answer);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch {
        onError("Failed to establish connection");
      }
      unsub();
    }
  });

  return { pc, localStream, unsubscribe: unsub };
}

export async function answerCall(callId, agent, { onRemoteStream, onConnected, onError }) {
  const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const pc = new RTCPeerConnection(ICE_SERVERS);

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    if (event.streams[0]) onRemoteStream(event.streams[0]);
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "connected") onConnected();
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      onError("Connection lost");
    }
  };

  const calls = await base44.entities.SupportCall.filter({ id: callId });
  const call = calls[0];
  if (!call?.sdp_offer) throw new Error("No call offer found");

  const offer = JSON.parse(call.sdp_offer);
  await pc.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForIceGathering(pc);

  await base44.entities.SupportCall.update(callId, {
    sdp_answer: JSON.stringify(pc.localDescription),
    status: "connected",
    agent_id: agent.id,
    agent_name: agent.full_name || agent.email || "Support Agent",
    connected_at: new Date().toISOString(),
  });

  return { pc, localStream };
}

export function endCall(pc) {
  if (!pc) return;
  try {
    pc.getSenders().forEach(sender => {
      if (sender.track) sender.track.stop();
    });
    pc.close();
  } catch {}
}

export function toggleMute(localStream, isMuted) {
  if (!localStream) return;
  localStream.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });
}