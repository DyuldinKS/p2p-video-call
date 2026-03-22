import { EventEmitter } from './eventEmitter';
import { createLogger } from './logger';

const log = createLogger('webrtc');

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

log.info('ICE servers', RTC_CONFIG.iceServers);

const waitForIceGathering = (pc: RTCPeerConnection): Promise<string> =>
  new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve(pc.localDescription!.sdp);
      return;
    }
    const onStateChange = () => {
      log.debug('ICE gathering state:', pc.iceGatheringState);
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', onStateChange);
        resolve(pc.localDescription!.sdp);
      }
    };
    pc.addEventListener('icegatheringstatechange', onStateChange);
  });

export const getLocalStream = (): Promise<MediaStream> =>
  navigator.mediaDevices.getUserMedia({ video: true, audio: true });

type PeerSessionEvents = {
  connected: (remoteStream: MediaStream) => void;
};

export class PeerSession {
  private pc!: RTCPeerConnection;
  private localStream!: MediaStream;
  private events = new EventEmitter<PeerSessionEvents>();

  on<K extends keyof PeerSessionEvents>(
    event: K,
    listener: PeerSessionEvents[K],
  ): () => void {
    return this.events.on(event, listener);
  }

  start(localStream: MediaStream): void {
    this.localStream = localStream;
    this.pc = new RTCPeerConnection(RTC_CONFIG);

    for (const track of localStream.getTracks()) {
      this.pc.addTrack(track, localStream);
    }

    const remoteStream = new MediaStream();

    this.pc.addEventListener('track', (e) => {
      remoteStream.addTrack(e.track);
    });

    this.pc.addEventListener('connectionstatechange', () => {
      log.info('Connection state:', this.pc.connectionState);
      if (this.pc.connectionState === 'connected') {
        this.events.emit('connected', remoteStream);
      }
    });

    this.pc.addEventListener('signalingstatechange', () => {
      log.debug('Signaling state:', this.pc.signalingState);
    });

    this.pc.addEventListener('icecandidate', (e) => {
      if (e.candidate) {
        log.debug('ICE candidate:', e.candidate.candidate);
      }
    });
  }

  async createOffer(): Promise<string> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return waitForIceGathering(this.pc);
  }

  async createAnswer(offerSdp: string): Promise<string> {
    await this.pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return waitForIceGathering(this.pc);
  }

  async acceptAnswer(answerSdp: string): Promise<void> {
    await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  }

  stop(): void {
    this.pc?.close();
  }
}
