import { createStore } from 'solid-js/store';
import { PeerSession } from './webrtc';

interface CallStoreState {
  peerSession?: PeerSession;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export const [store, setStore] = createStore<CallStoreState>({});
