import {
  createEffect,
  createResource,
  createSignal,
  Match,
  onCleanup,
  Switch,
} from 'solid-js';
import { compressSdp, decompressSdp } from '../utils/sdp';
import { setStore } from '../utils/callStore';
import { getLocalStream, PeerSession } from '../utils/webrtc';
import SdpBox from './SdpBox';

interface Props {
  onConnected: () => void;
  onBack: () => void;
  initialOffer?: string;
}

// Accepts a full join URL (http://host/<compressed>) or a plain compressed SDP.
const extractCompressed = (input: string): string => {
  try {
    return new URL(input).pathname.slice(1) || input;
  } catch {
    return input;
  }
};

const JoinCall = (props: Props) => {
  const [offerInput, setOfferInput] = createSignal(props.initialOffer ?? '');
  const [submittedOffer, setSubmittedOffer] = createSignal<string | null>(
    props.initialOffer ?? null,
  );
  const [answerSdp] = createResource(submittedOffer, async (input) => {
    const compressed = extractCompressed(input);
    const sdp = await decompressSdp(compressed);
    const localStream = await getLocalStream();
    const peerSession = new PeerSession();
    setStore('peerSession', peerSession);
    setStore('localStream', localStream);
    onCleanup(
      peerSession.on('connected', (remoteStream) => {
        setStore('remoteStream', remoteStream);
        props.onConnected();
      }),
    );
    peerSession.start(localStream);
    return peerSession.createAnswer(sdp);
  });

  const [compressedAnswer] = createResource(answerSdp, compressSdp);
  const [copiedAnswer, setCopiedAnswer] = createSignal(false);

  createEffect(() => {
    if (compressedAnswer() && localStorage.getItem('devAutoCopy') === 'true') {
      copyAnswer();
    }
  });

  const copyAnswer = async () => {
    const val = compressedAnswer();
    if (!val) return;
    await navigator.clipboard.writeText(val);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const handleOffer = () => {
    const offerSdp = offerInput().trim();
    if (!offerSdp) return;
    setSubmittedOffer(offerSdp);
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

      <Switch>
        <Match when={!submittedOffer() || answerSdp.loading}>
          <div class="flex flex-col gap-2">
            <p class="text-sm text-gray-300 font-medium">
              Paste the offer from the other person
            </p>
            <textarea
              rows={4}
              placeholder="Paste join URL"
              class="w-full rounded-lg bg-slate-900 text-gray-200 font-mono text-xs p-3 resize-none border border-slate-600 focus:outline-none focus:border-blue-500"
              value={offerInput()}
              onInput={(e) => setOfferInput(e.currentTarget.value)}
            />
            <button
              class="w-full px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-40"
              disabled={!offerInput().trim() || answerSdp.loading}
              onClick={handleOffer}
            >
              {answerSdp.loading ? 'Generating…' : 'Generate answer'}
            </button>
          </div>
        </Match>

        <Match when={answerSdp()}>
          {(sdp) => (
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <p class="text-sm text-gray-300 font-medium">
                  Step 1 — Copy your answer and send it to the host
                </p>
                <SdpBox label="Your answer" sdp={sdp()} />
                <button
                  class="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-40"
                  disabled={!compressedAnswer()}
                  onClick={copyAnswer}
                >
                  {copiedAnswer() ? 'Copied!' : 'Copy answer'}
                </button>
              </div>
              <p class="text-sm text-gray-500">Waiting for the host...</p>
            </div>
          )}
        </Match>

        <Match when={answerSdp.error}>
          {(err) => (
            <>
              <p class="text-red-400 text-sm">{String(err())}</p>
              <button
                class="self-start text-sm text-gray-400 hover:text-white"
                onClick={props.onBack}
              >
                ← Go back
              </button>
            </>
          )}
        </Match>
      </Switch>
    </div>
  );
};

export default JoinCall;
