import { createSignal, onMount, onCleanup } from 'solid-js';

interface Props {
  localStream: MediaStream;
  remoteStream: MediaStream;
  onHangUp: () => void;
}

export default function CallView(props: Props) {
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
    <div class="flex flex-col flex-1 gap-4">
      {/* Remote video — main area */}
      <div class="relative flex-1 rounded-2xl overflow-hidden bg-slate-900">
        <video
          ref={remoteVideoEl}
          autoplay
          playsinline
          class="w-full h-full object-cover"
        />

        {/* Local video — picture-in-picture */}
        <div class="absolute bottom-4 right-4 w-36 rounded-xl overflow-hidden shadow-lg border border-slate-700">
          <video
            ref={localVideoEl}
            autoplay
            playsinline
            muted
            class="w-full object-cover"
          />
        </div>
      </div>

      {/* Controls */}
      <div class="flex items-center justify-center gap-4 pb-2">
        <button
          class="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
          classList={{
            'bg-slate-600 hover:bg-slate-500': !muted(),
            'bg-red-600 hover:bg-red-500': muted(),
          }}
          onClick={toggleMute}
          title={muted() ? 'Unmute' : 'Mute'}
        >
          {muted() ? '🔇' : '🎙️'}
        </button>

        <button
          class="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors text-xl"
          onClick={props.onHangUp}
          title="Hang up"
        >
          📵
        </button>

        <button
          class="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
          classList={{
            'bg-slate-600 hover:bg-slate-500': !cameraOff(),
            'bg-red-600 hover:bg-red-500': cameraOff(),
          }}
          onClick={toggleCamera}
          title={cameraOff() ? 'Turn camera on' : 'Turn camera off'}
        >
          {cameraOff() ? '🚫' : '📷'}
        </button>
      </div>
    </div>
  );
}
