import { createLogger } from './logger';

const log = createLogger('webrtc');

export type PeerRole = 'caller' | 'callee';

export interface PeerConnection {
  pc: RTCPeerConnection;
  localStream: MediaStream;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

log.info('ICE servers', RTC_CONFIG.iceServers);

/** Wait for ICE gathering to complete, then return the local description SDP. */
function waitForIceGathering(pc: RTCPeerConnection): Promise<string> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve(pc.localDescription!.sdp);
      return;
    }
    pc.addEventListener('icegatheringstatechange', () => {
      log.debug('ICE gathering state:', pc.iceGatheringState);
      if (pc.iceGatheringState === 'complete') {
        resolve(pc.localDescription!.sdp);
      }
    });
  });
}

export async function getLocalStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}

/**
 * Caller side: create offer, set local description, wait for ICE gathering.
 * Returns the full SDP offer string to share with the callee.
 */
export async function createOffer(pc: RTCPeerConnection): Promise<string> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return waitForIceGathering(pc);
}

/**
 * Callee side: set remote description from offer SDP, create answer,
 * set local description, wait for ICE gathering.
 * Returns the full SDP answer string to share with the caller.
 */
export async function createAnswer(
  pc: RTCPeerConnection,
  offerSdp: string,
): Promise<string> {
  await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return waitForIceGathering(pc);
}

/**
 * Caller side: set the remote description from the callee's answer SDP.
 */
export async function acceptAnswer(
  pc: RTCPeerConnection,
  answerSdp: string,
): Promise<void> {
  await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
}

/**
 * Create a new RTCPeerConnection, attach local stream tracks,
 * and wire up the remote stream callback.
 */
export function createPeerConnection(
  localStream: MediaStream,
  onRemoteStream: (stream: MediaStream) => void,
): RTCPeerConnection {
  const pc = new RTCPeerConnection(RTC_CONFIG);

  for (const track of localStream.getTracks()) {
    pc.addTrack(track, localStream);
  }

  const remoteStream = new MediaStream();

  pc.addEventListener('track', (e) => {
    remoteStream.addTrack(e.track);
  });

  pc.addEventListener('iceconnectionstatechange', () => {
    log.info('ICE connection state:', pc.iceConnectionState);
    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      onRemoteStream(remoteStream);
    }
  });

  pc.addEventListener('signalingstatechange', () => {
    log.debug('Signaling state:', pc.signalingState);
  });

  pc.addEventListener('icecandidate', (e) => {
    if (e.candidate) {
      log.debug('ICE candidate:', e.candidate.candidate);
    }
  });

  return pc;
}
