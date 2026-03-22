interface Props {
  onStart: () => void;
  onJoin: () => void;
}

const Landing = (props: Props) => {
  return (
    <div class="flex flex-col items-center justify-center flex-1 gap-6">
      <p class="text-gray-400 text-center max-w-sm">
        Exchange connection info manually — no server needed.
      </p>
      <div class="flex gap-2">
        <button
          class="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          onClick={props.onStart}
        >
          Start a call
        </button>
        <button
          class="px-6 py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-semibold transition-colors"
          onClick={props.onJoin}
        >
          Join a call
        </button>
      </div>
    </div>
  );
};

export default Landing;
