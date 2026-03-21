import { createSignal, Match, Switch } from 'solid-js';
import { AsyncValue } from '../utils/asyncValue';
import { useAsyncValue } from '../utils/useAsyncValue';
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

export default function JoinCall(props: Props) {
  const [offerInput, setOfferInput] = createSignal('');
  const [answer, { track }] = useAsyncValue<string>(null);

  const handleOffer = () => {
    const offerSdp = offerInput().trim();
    if (!offerSdp) return;
    track(
      getLocalStream().then((localStream) => {
        const pc = createPeerConnection(localStream, (remote) => {
          props.onConnected(localStream, remote);
        });
        return createAnswer(pc, offerSdp);
      }),
    );
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
        <Match when={AsyncValue.isNotAsked(answer()) || AsyncValue.isLoading(answer())}>
          <div class="flex flex-col gap-2">
            <p class="text-sm text-gray-300 font-medium">
              Paste the offer from the other person
            </p>
            <textarea
              rows={6}
              placeholder="Paste offer SDP here…"
              class="w-full rounded-lg bg-slate-900 text-gray-200 font-mono text-xs p-3 resize-none border border-slate-600 focus:outline-none focus:border-blue-500"
              onInput={(e) => setOfferInput(e.currentTarget.value)}
            />
            <button
              class="self-end px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-40"
              disabled={!offerInput().trim() || AsyncValue.isLoading(answer())}
              onClick={handleOffer}
            >
              {AsyncValue.isLoading(answer()) ? 'Generating…' : 'Generate answer'}
            </button>
          </div>
        </Match>

        <Match when={answer().data}>
          {(sdp) => (
            <div class="flex flex-col gap-1">
              <p class="text-sm text-gray-300 font-medium">
                Send this answer back — then wait for the call to connect
              </p>
              <SdpBox label="Your answer" sdp={sdp()} />
              <p class="text-xs text-gray-500">
                The call will connect automatically once they paste your answer.
              </p>
            </div>
          )}
        </Match>

        <Match when={answer().error}>
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
}
