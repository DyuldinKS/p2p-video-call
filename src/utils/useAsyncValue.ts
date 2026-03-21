import { createSignal, type Accessor } from 'solid-js';
import { AsyncValue, type AsyncValueType } from './asyncValue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

type SetStateAction<T> = T | ((prev: T) => T);

export type UseAsyncValueMethods<SuccessData, InitialData = null, Err = Any> = {
  getState: () => AsyncValueType<SuccessData, InitialData, Err>;
  setState: (
    updater: SetStateAction<AsyncValueType<SuccessData, InitialData, Err>>,
  ) => void;
  setNotAsked: (data?: InitialData) => void;
  setLoading: (data?: InitialData) => void;
  setSuccess: (data: SuccessData) => void;
  setFailure: (error: Err, data?: InitialData) => void;
  track: (promise: Promise<SuccessData>) => Promise<SuccessData | void>;
};

export type UseAsyncValueReturn<SuccessData, InitialData = null, Err = Any> = [
  state: Accessor<AsyncValueType<SuccessData, InitialData, Err>>,
  methods: UseAsyncValueMethods<SuccessData, InitialData, Err>,
];

/**
 * A hook that bounds AsyncValue state and its updates to SolidJS signals.
 * @param initialState - initial state of the AsyncValue
 * @param log - a function to log changes of the AsyncValue state.
 * @returns a tuple consisting of the AsyncValue accessor and the object
 * representing the set of methods to control the AsyncValue state.
 * The methods object is stable, and updates trigger reactivity in SolidJS.
 */
export const useAsyncValue = <SuccessData, InitialData = null, Err = Any>(
  initialState: InitialData,
  log?: (...args: Any[]) => void,
): UseAsyncValueReturn<SuccessData, InitialData, Err> => {
  const [state, setStateSignal] = createSignal<
    AsyncValueType<SuccessData, InitialData, Err>
  >(AsyncValue.makeNotAsked(initialState));

  let counter = 0;

  const methods: UseAsyncValueMethods<SuccessData, InitialData, Err> = {
    getState: () => state(),

    setState: (updater) => {
      const current = state();
      const newState =
        typeof updater === 'function' ? updater(current) : updater;
      setStateSignal(newState);
    },

    setNotAsked: (newState = initialState) => {
      log?.('av notAsked', newState);
      setStateSignal(AsyncValue.makeNotAsked(newState));
      counter += 1;
    },

    setLoading: (newState = initialState) => {
      log?.('av loading', newState);
      setStateSignal(AsyncValue.makeLoading(newState));
      counter += 1;
    },

    setSuccess: (newState: SuccessData) => {
      log?.('av success', newState);
      setStateSignal(AsyncValue.makeSuccess(newState));
      counter += 1;
    },

    setFailure: (err: Err, newState = initialState) => {
      log?.('av failure', err, newState);
      setStateSignal(AsyncValue.makeFailure(err, newState));
      counter += 1;
    },

    track: async (promise: Promise<SuccessData>) => {
      methods.setLoading();
      const loadingId = counter;

      return promise
        .then((res) => {
          if (loadingId !== counter) return;

          methods.setSuccess(res);
          return res;
        })
        .catch((err) => {
          if (loadingId !== counter) return;

          methods.setFailure(err);
        });
    },
  };

  return [state, methods];
};
