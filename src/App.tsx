import { batch, createEffect, createSignal, Match, Switch } from 'solid-js';
import { callStore } from './utils/callStore';
import CallView from './components/CallView';
import JoinCall from './components/JoinCall';
import Landing from './components/Landing';
import StartCall from './components/StartCall';

type View = 'landing' | 'start' | 'join' | 'call';

interface CallStreams {
  local: MediaStream;
  remote: MediaStream;
}

const App = () => {
  const initialOffer = location.pathname.slice(1) || undefined;
  const [view, setView] = createSignal<View>(initialOffer ? 'join' : 'landing');
  const [streams, setStreams] = createSignal<CallStreams | null>(null);

  const onConnected = (local: MediaStream, remote: MediaStream) => {
    setStreams({ local, remote });
    setView('call');
  };

  const hangUp = () => {
    callStore.getItem('peerSession')?.stop();
    callStore.getItem('localStream')?.getTracks().forEach((t) => t.stop());
    callStore.removeItem('peerSession');
    callStore.removeItem('localStream');
    callStore.removeItem('remoteStream');
    batch(() => {
      setStreams(null);
      setView('landing');
    });
  };

  createEffect(() => {
    if (view() === 'landing') {
      history.replaceState(null, '', '/');
    }
  });

  return (
    <div class="flex flex-col min-h-screen p-6 box-border bg-slate-800 gap-y-4">
      <h1 class="text-2xl font-bold text-gray-300">p2p video call</h1>

      <Switch>
        <Match when={view() === 'landing'}>
          <Landing
            onStart={() => setView('start')}
            onJoin={() => setView('join')}
          />
        </Match>

        <Match when={view() === 'start'}>
          <StartCall
            onConnected={onConnected}
            onBack={() => setView('landing')}
          />
        </Match>

        <Match when={view() === 'join'}>
          <JoinCall
            initialOffer={initialOffer}
            onConnected={onConnected}
            onBack={() => setView('landing')}
          />
        </Match>

        <Match when={view() === 'call'}>
          <CallView
            localStream={streams()!.local}
            remoteStream={streams()!.remote}
            onHangUp={hangUp}
          />
        </Match>
      </Switch>
    </div>
  );
};

export default App;
