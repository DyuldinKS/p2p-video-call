import { createEffect, createSignal, Match, Switch } from 'solid-js';
import { store, setStore } from './utils/callStore';
import CallView from './components/CallView';
import JoinCall from './components/JoinCall';
import Landing from './components/Landing';
import StartCall from './components/StartCall';

type View = 'landing' | 'start' | 'join' | 'call';

const App = () => {
  const initialOffer = location.pathname.slice(1) || undefined;
  if (initialOffer) {
    history.replaceState(null, '', '/');
  }
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
    view();
    history.replaceState(null, '', '/');
  });

  return (
    <div class="flex flex-col h-screen p-4 box-border bg-slate-800 gap-y-4 overflow-hidden">
      <h1
        class="text-2xl font-bold text-gray-300 cursor-pointer hover:text-white transition-colors w-fit shrink-0"
        onClick={hangUp}
      >
        p2p video call
      </h1>

      <div class="flex-1 flex flex-col min-h-0">
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
    </div>
  );
};

export default App;
