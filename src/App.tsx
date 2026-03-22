import { createEffect, createSignal, Match, Switch } from 'solid-js';
import { store, setStore } from './utils/callStore';
import CallView from './components/CallView';
import JoinCall from './components/JoinCall';
import Landing from './components/Landing';
import StartCall from './components/StartCall';

type View = 'landing' | 'start' | 'join' | 'call';

const App = () => {
  const initialOffer = location.pathname.slice(1) || undefined;
  const [view, setView] = createSignal<View>(initialOffer ? 'join' : 'landing');

  const onConnected = () => setView('call');

  const hangUp = () => {
    store.peerSession?.stop();
    store.localStream?.getTracks().forEach((t) => t.stop());
    store.remoteStream?.getTracks().forEach((t) => t.stop());
    setStore({
      peerSession: undefined,
      localStream: undefined,
      remoteStream: undefined,
    });
    setView('landing');
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
          <StartCall onConnected={onConnected} onBack={hangUp} />
        </Match>

        <Match when={view() === 'join'}>
          <JoinCall
            initialOffer={initialOffer}
            onConnected={onConnected}
            onBack={hangUp}
          />
        </Match>

        <Match when={view() === 'call'}>
          <CallView
            localStream={store.localStream!}
            remoteStream={store.remoteStream!}
            onHangUp={hangUp}
          />
        </Match>
      </Switch>
    </div>
  );
};

export default App;
