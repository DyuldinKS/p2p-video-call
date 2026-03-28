import { createSignal, onMount, onCleanup } from 'solid-js';

interface Props {
  localStream: MediaStream;
  remoteStream: MediaStream;
  onHangUp: () => void;
}

const CallView = (props: Props) => {
  const [muted, setMuted] = createSignal(false);
  const [cameraOff, setCameraOff] = createSignal(false);

  const localStream = props.localStream;
  const remoteStream = props.remoteStream;

  let remoteVideoEl: HTMLVideoElement | undefined;
  let localVideoEl: HTMLVideoElement | undefined;

  onMount(() => {
    if (remoteVideoEl) remoteVideoEl.srcObject = remoteStream;
    if (localVideoEl) localVideoEl.srcObject = localStream;
  });

  onCleanup(() => {
    localStream.getTracks().forEach((t) => t.stop());
  });

  const toggleMute = () => {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOff(!videoTrack.enabled);
    }
  };

  return (
    <div class="flex flex-col flex-1 min-h-0 gap-4">
      {/* Remote video — main area */}
      <div class="relative flex-1 min-h-0 rounded-2xl overflow-hidden bg-slate-900">
        <video
          ref={remoteVideoEl}
          autoplay
          playsinline
          aria-label="Remote video"
          class="w-full h-full object-contain"
        />

        {/* Local video — picture-in-picture */}
        <div class="absolute bottom-4 right-4 w-36 rounded-xl overflow-hidden shadow-lg border border-slate-700">
          <video
            ref={localVideoEl}
            autoplay
            playsinline
            muted
            aria-label="Local video"
            class="w-full object-cover"
          />
        </div>
      </div>

      {/* Controls */}
      <div class="flex items-center justify-center gap-2">
        <button
          class="px-5 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
          classList={{
            'bg-blue-700 hover:bg-blue-600': !muted(),
            'bg-slate-700 hover:bg-slate-600': muted(),
          }}
          onClick={toggleMute}
        >
          Mic
        </button>

        <button
          class="px-5 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
          classList={{
            'bg-blue-700 hover:bg-blue-600': !cameraOff(),
            'bg-slate-700 hover:bg-slate-600': cameraOff(),
          }}
          onClick={toggleCamera}
        >
          Camera
        </button>

        <button
          class="px-5 py-2 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
          onClick={props.onHangUp}
        >
          Hang up
        </button>
      </div>
    </div>
  );
};

export default CallView;
