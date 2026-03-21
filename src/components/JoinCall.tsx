/**
 * Callee flow:
 * 1. User pastes caller's offer SDP
 * 2. Generate answer SDP → user copies and sends back
 * → connection established
 */

import { createSignal, Show } from 'solid-js';
import {
  createAnswer,
  createPeerConnection,
  getLocalStream,
} from '../utils/webrtc';
import SdpBox from './SdpBox';

interface Props {
  onConnected: (local: MediaStream, remote: MediaStream) => void;
  onBack: () => void;
}

type Step = 'paste-offer' | 'generating' | 'answer-ready' | 'error';

export default function JoinCall(props: Props) {
  const [step, setStep] = createSignal<Step>('paste-offer');
  const [offerInput, setOfferInput] = createSignal('');
  const [answerSdp, setAnswerSdp] = createSignal('');
  const [error, setError] = createSignal('');

  const handleOffer = async () => {
    const offerSdp = offerInput().trim();
    if (!offerSdp) return;
    setStep('generating');
    try {
      const localStream = await getLocalStream();
      const pc = createPeerConnection(localStream, (remote) => {
        props.onConnected(localStream, remote);
      });
      const sdp = await createAnswer(pc, offerSdp);
      setAnswerSdp(sdp);
      setStep('answer-ready');
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
        <h2 class="text-lg font-semibold text-gray-200">Join a call</h2>
      </div>

      <Show when={step() === 'paste-offer' || step() === 'generating'}>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-gray-300 font-medium">Paste the offer from the other person</p>
          <textarea
            rows={6}
            placeholder="Paste offer SDP here…"
            class="w-full rounded-lg bg-slate-900 text-gray-200 font-mono text-xs p-3 resize-none border border-slate-600 focus:outline-none focus:border-blue-500"
            onInput={(e) => setOfferInput(e.currentTarget.value)}
          />
          <button
            class="self-end px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-40"
            disabled={!offerInput().trim() || step() === 'generating'}
            onClick={handleOffer}
          >
            {step() === 'generating' ? 'Generating…' : 'Generate answer'}
          </button>
        </div>
      </Show>

      <Show when={step() === 'answer-ready'}>
        <div class="flex flex-col gap-1">
          <p class="text-sm text-gray-300 font-medium">
            Send this answer back — then wait for the call to connect
          </p>
          <SdpBox label="Your answer" sdp={answerSdp()} />
        </div>
        <p class="text-xs text-gray-500">
          The call will connect automatically once they paste your answer.
        </p>
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
