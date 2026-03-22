import { createResource } from 'solid-js';
import { compressSdp } from '../utils/sdp';

interface Props {
  label: string;
  sdp: string;
}

const SdpBox = (props: Props) => {
  const [hex] = createResource(() => props.sdp, compressSdp);

  return (
    <div class="flex flex-col gap-1">
      <span class="text-sm text-gray-400">{props.label}</span>
      <textarea
        readOnly
        rows={6}
        class="w-full rounded-lg bg-slate-900 text-green-400 font-mono text-xs p-3 resize-none border border-slate-600 focus:outline-none"
        value={hex() ?? ''}
      />
    </div>
  );
};

export default SdpBox;
