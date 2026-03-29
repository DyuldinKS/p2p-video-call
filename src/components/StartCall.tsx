/**
 * Caller flow:
 * 1. Generate offer SDP → user copies and sends to callee
 * 2. User pastes callee's answer SDP → connection established
 */

import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { compressSdp, decompressSdp } from '../utils/sdp';
import { setStore } from '../utils/callStore';
import { getLocalStream, PeerSession } from '../utils/webrtc';
import SdpBox from './SdpBox';

interface Props {
  onConnected: () => void;
  onBack: () => void;
}

type Step = 'init' | 'offer-ready' | 'waiting-answer' | 'error';

const StartCall = (props: Props) => {
  const [step, setStep] = createSignal<Step>('init');
  const [offerSdp, setOfferSdp] = createSignal('');
  const [joinUrl, setJoinUrl] = createSignal('');
  const [copiedUrl, setCopiedUrl] = createSignal(false);
  const [answerInput, setAnswerInput] = createSignal('');
  const [error, setError] = createSignal('');

  let peerSession: PeerSession | undefined;
  let localStream: MediaStream | undefined;

  onMount(async () => {
    try {
      localStream = await getLocalStream();
      peerSession = new PeerSession();
      setStore('peerSession', peerSession);
      setStore('localStream', localStream);
      onCleanup(
        peerSession.on('connected', (remoteStream) => {
          setStore('remoteStream', remoteStream);
          props.onConnected();
        }),
      );
      peerSession.start(localStream);
      const sdp = await peerSession.createOffer();
      setOfferSdp(sdp);
      setStep('offer-ready');
      const compressed = await compressSdp(sdp);
      const url = `${location.origin}/${compressed}`;
      setJoinUrl(url);

      if (localStorage.getItem('devAutoCopy') === 'true') {
        copyJoinUrl();
      }
    } catch (e) {
      setError(String(e));
      setStep('error');
    }
  });

  const copyJoinUrl = async () => {
    await navigator.clipboard.writeText(joinUrl());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const submitAnswer = async () => {
    const raw = answerInput().trim();
    if (!raw || !peerSession) return;
    try {
      setStep('waiting-answer');
      const sdp = await decompressSdp(raw);
      await peerSession.acceptAnswer(sdp);
    } catch (e) {
      setError(String(e));
      setStep('error');
    }
  };

  return (
    <div class="flex flex-col gap-6 w-full max-w-lg mx-auto">
      <div class="flex items-center gap-3">
        <button
          class="text-gray-400 hover:text-white transition-colors text-sm"
          onClick={props.onBack}
        >
          ← Back
        </button>
        <h2 class="text-lg font-semibold text-gray-200">Start a call</h2>
      </div>

      <Show when={step() === 'init'}>
        <p class="text-gray-400 text-sm">
          Getting camera and generating offer…
        </p>
      </Show>

      <Show when={step() === 'offer-ready' || step() === 'waiting-answer'}>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-gray-300 font-medium">
            Step 1 — Send URL to join to the other person
          </p>
          <SdpBox label="Your offer" sdp={offerSdp()} />
          <button
            class="py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-40"
            disabled={!joinUrl()}
            onClick={copyJoinUrl}
          >
            {copiedUrl() ? 'Copied!' : 'Copy join URL'}
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-gray-300 font-medium">
            Step 2 — Paste their answer here
          </p>
          <textarea
            rows={4}
            placeholder="Paste answer"
            class="w-full rounded-lg bg-slate-900 text-gray-200 font-mono text-xs p-3 resize-none border border-slate-600 focus:outline-none focus:border-blue-500"
            onInput={(e) => setAnswerInput(e.currentTarget.value)}
          />
          <button
            class="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-40"
            disabled={!answerInput().trim() || step() === 'waiting-answer'}
            onClick={submitAnswer}
          >
            Connect
          </button>
        </div>
      </Show>

      <Show when={step() === 'error'}>
        <p class="text-red-400 text-sm">{error()}</p>
      </Show>
    </div>
  );
};

export default StartCall;
