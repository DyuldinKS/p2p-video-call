export const ASYNC_VALUE_STATUS = {
  notAsked: 'notAsked',
  loading: 'loading',
  success: 'success',
  failure: 'failure',
} as const;

export type AsyncValueStatus =
  (typeof ASYNC_VALUE_STATUS)[keyof typeof ASYNC_VALUE_STATUS];

export type AsyncValueNotAsked<InitialData> = {
  data: InitialData;
  error: null;
  status: typeof ASYNC_VALUE_STATUS.notAsked;
};

export type AsyncValueLoading<InitialData> = {
  data: InitialData;
  error: null;
  status: typeof ASYNC_VALUE_STATUS.loading;
};

export type AsyncValueFailure<InitialData, Err> = {
  data: InitialData;
  error: Err;
  status: typeof ASYNC_VALUE_STATUS.failure;
};

export type AsyncValueSuccess<SuccessData> = {
  data: SuccessData;
  error: null;
  status: typeof ASYNC_VALUE_STATUS.success;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AsyncValueType<SuccessData, InitialData = null, Err = any> =
  | AsyncValueNotAsked<InitialData>
  | AsyncValueLoading<InitialData>
  | AsyncValueFailure<InitialData, Err>
  | AsyncValueSuccess<SuccessData>;

const makeStatusGuard = <T extends AsyncValueStatus>(status: T) => {
  type Res<SuccessData, InitialData, Err> =
    T extends typeof ASYNC_VALUE_STATUS.notAsked
      ? AsyncValueNotAsked<InitialData>
      : T extends typeof ASYNC_VALUE_STATUS.loading
        ? AsyncValueLoading<InitialData>
        : T extends typeof ASYNC_VALUE_STATUS.failure
          ? AsyncValueFailure<InitialData, Err>
          : AsyncValueSuccess<SuccessData>;

  return <SuccessData, InitialData, Err>(
    rData: AsyncValueType<SuccessData, InitialData, Err>,
  ): rData is Res<SuccessData, InitialData, Err> => rData.status === status;
};

/** Helper for async value data structure */
export const AsyncValue = {
  /* ------------------------------- factory methods ------------------------------- */

  makeNotAsked<InitialData>(
    data: InitialData,
  ): AsyncValueNotAsked<InitialData> {
    return { data, error: null, status: ASYNC_VALUE_STATUS.notAsked };
  },
  makeLoading<InitialData>(data: InitialData): AsyncValueLoading<InitialData> {
    return { data, error: null, status: ASYNC_VALUE_STATUS.loading };
  },
  makeSuccess<SuccessData>(data: SuccessData): AsyncValueSuccess<SuccessData> {
    return { data, error: null, status: ASYNC_VALUE_STATUS.success };
  },
  makeFailure<InitialData, Err>(
    error: Err,
    data: InitialData,
  ): AsyncValueFailure<InitialData, Err> {
    return { data, error, status: ASYNC_VALUE_STATUS.failure };
  },

  /* ----------------------------- status type guards ----------------------------- */

  isNotAsked: makeStatusGuard(ASYNC_VALUE_STATUS.notAsked),
  isLoading: makeStatusGuard(ASYNC_VALUE_STATUS.loading),
  isFailure: makeStatusGuard(ASYNC_VALUE_STATUS.failure),
  isSuccess: makeStatusGuard(ASYNC_VALUE_STATUS.success),
  isSuccessAll: (
    AsyncValueList: AsyncValueType<unknown>[],
  ): AsyncValueList is AsyncValueSuccess<unknown>[] =>
    AsyncValueList.every(AsyncValue.isSuccess),

  /* map */
  map<
    T,
    Init,
    Err,
    SuccessRes = null,
    FailRes = null,
    LoadingRes = null,
    NotAskedRes = null,
  >(
    {
      notAsked = returnNull,
      loading = returnNull,
      success = returnNull,
      failure = returnNull,
    }: {
      notAsked?: (initVal: Init) => NotAskedRes;
      loading?: () => LoadingRes;
      success?: (val: T) => SuccessRes;
      failure?: (err: Err) => FailRes;
    },
    asyncValue: AsyncValueType<T, Init, Err>,
  ) {
    if (this.isSuccess(asyncValue)) return success(asyncValue.data);
    if (this.isFailure(asyncValue)) return failure(asyncValue.error);
    if (this.isLoading(asyncValue)) return loading();
    return notAsked(asyncValue.data);
  },
};

const returnNull = () => null as any;
