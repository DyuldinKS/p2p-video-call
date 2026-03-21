/**
 * Caller flow:
 * 1. Generate offer SDP → user copies and sends to callee
 * 2. User pastes callee's answer SDP → connection established
 */

import { createSignal, onMount, Show } from 'solid-js';
import { decompressSdp } from '../utils/sdp';
import {
  acceptAnswer,
  createOffer,
  createPeerConnection,
  getLocalStream,
} from '../utils/webrtc';
import SdpBox from './SdpBox';

interface Props {
  onConnected: (local: MediaStream, remote: MediaStream) => void;
  onBack: () => void;
}

type Step = 'init' | 'offer-ready' | 'waiting-answer' | 'error';

export default function StartCall(props: Props) {
  const [step, setStep] = createSignal<Step>('init');
  const [offerSdp, setOfferSdp] = createSignal('');
  const [answerInput, setAnswerInput] = createSignal('');
  const [error, setError] = createSignal('');

  let pc: RTCPeerConnection | undefined;
  let localStream: MediaStream | undefined;

  onMount(async () => {
    try {
      localStream = await getLocalStream();
      pc = createPeerConnection(localStream, (remote) => {
        props.onConnected(localStream!, remote);
      });
      const sdp = await createOffer(pc);
      setOfferSdp(sdp);
      setStep('offer-ready');
    } catch (e) {
      setError(String(e));
      setStep('error');
    }
  });

  const submitAnswer = async () => {
    const raw = answerInput().trim();
    if (!raw || !pc) return;
    try {
      setStep('waiting-answer');
      const sdp = await decompressSdp(raw);
      await acceptAnswer(pc, sdp);
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
        <p class="text-gray-400 text-sm">Getting camera and generating offer…</p>
      </Show>

      <Show when={step() === 'offer-ready' || step() === 'waiting-answer'}>
        <div class="flex flex-col gap-1">
          <p class="text-sm text-gray-300 font-medium">Step 1 — Send this offer to the other person</p>
          <SdpBox label="Your offer" sdp={offerSdp()} />
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-gray-300 font-medium">Step 2 — Paste their answer here</p>
          <textarea
            rows={6}
            placeholder="Paste answer SDP here…"
            class="w-full rounded-lg bg-slate-900 text-gray-200 font-mono text-xs p-3 resize-none border border-slate-600 focus:outline-none focus:border-blue-500"
            onInput={(e) => setAnswerInput(e.currentTarget.value)}
          />
          <button
            class="self-end px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-40"
            disabled={!answerInput().trim() || step() === 'waiting-answer'}
            onClick={submitAnswer}
          >
            Connect
          </button>
        </div>
      </Show>

      <Show when={step() === 'error'}>
        <p class="text-red-400 text-sm">{error()}</p>
        <button
          class="self-start text-sm text-gray-400 hover:text-white"
          onClick={props.onBack}
        >
          ← Go back
        </button>
      </Show>
    </div>
  );
}
