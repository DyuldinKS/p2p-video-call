import { PeerSession } from './webrtc';

interface StoreItems {
  peerSession: PeerSession;
  localStream: MediaStream;
  remoteStream: MediaStream;
}

class CallStore {
  private store: Partial<StoreItems> = {};

  setItem<K extends keyof StoreItems>(key: K, value: StoreItems[K]) {
    this.store[key] = value;
  }

  getItem<K extends keyof StoreItems>(key: K): StoreItems[K] | undefined {
    return this.store[key];
  }

  removeItem(key: keyof StoreItems) {
    delete this.store[key];
  }
}

export const callStore = new CallStore();
