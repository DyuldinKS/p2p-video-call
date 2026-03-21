/** Reusable component for displaying a read-only SDP blob with a copy button. */

import { createSignal } from 'solid-js';

interface Props {
  label: string;
  sdp: string;
}

export default function SdpBox(props: Props) {
  const [copied, setCopied] = createSignal(false);

  const copy = async () => {
    await navigator.clipboard.writeText(props.sdp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-400">{props.label}</span>
        <button
          class="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          onClick={copy}
        >
          {copied() ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <textarea
        readOnly
        rows={6}
        class="w-full rounded-lg bg-slate-900 text-green-400 font-mono text-xs p-3 resize-none border border-slate-600 focus:outline-none"
        value={props.sdp}
      />
    </div>
  );
}
