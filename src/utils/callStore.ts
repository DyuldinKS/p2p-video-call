import { createStore } from 'solid-js/store';
import { PeerSession } from './webrtc';

interface CallStoreState {
  peerSession?: PeerSession;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export const [store, setStore] = createStore<CallStoreState>({});

if (localStorage.getItem('devMode') === 'true') {
  (window as any)._store = store;
  Object.defineProperty(window, '_peer', {
    get: () => store.peerSession,
    configurable: true,
  });
}
