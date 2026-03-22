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

export class PeerSession {
  private pc!: RTCPeerConnection;

  start(
    localStream: MediaStream,
    onRemoteStream: (stream: MediaStream) => void,
  ): void {
    this.pc = new RTCPeerConnection(RTC_CONFIG);

    for (const track of localStream.getTracks()) {
      this.pc.addTrack(track, localStream);
    }

    const remoteStream = new MediaStream();

    this.pc.addEventListener('track', (e) => {
      remoteStream.addTrack(e.track);
    });

    this.pc.addEventListener('iceconnectionstatechange', () => {
      log.info('ICE connection state:', this.pc.iceConnectionState);
      if (
        this.pc.iceConnectionState === 'connected' ||
        this.pc.iceConnectionState === 'completed'
      ) {
        onRemoteStream(remoteStream);
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
