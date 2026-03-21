import { createResource, createSignal } from 'solid-js';
import { compressSdp } from '../utils/sdp';

interface Props {
  label: string;
  sdp: string;
  onCopied?: () => void;
}

export default function SdpBox(props: Props) {
  const [copied, setCopied] = createSignal(false);
  const [hex] = createResource(() => props.sdp, compressSdp);

  const copy = async () => {
    const value = hex();
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    props.onCopied?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-400">{props.label}</span>
        <button
          class="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40"
          disabled={hex.loading}
          onClick={copy}
        >
          {copied() ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <textarea
        readOnly
        rows={6}
        class="w-full rounded-lg bg-slate-900 text-green-400 font-mono text-xs p-3 resize-none border border-slate-600 focus:outline-none"
        value={hex() ?? ''}
      />
    </div>
  );
}
