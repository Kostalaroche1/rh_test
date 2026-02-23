import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

/* ========= GET ========= */
export function useGet<T>(
  key: string[],
  api: () => Promise<T>
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: api,
  });
}
export function useGet_<T>(
  key: string[],
  api: (id : any) => Promise<any>
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: api,
  });
}

/* ========= POST ========= */
export function usePost<TResponse, TBody>(
  api: (body: TBody) => Promise<TResponse>,
  invalidate?: string[]
) {
  const queryClient = useQueryClient();

  return useMutation<TResponse, Error, TBody>({
    mutationFn: api,
    onSuccess: () => {
      if (invalidate) {
        queryClient.invalidateQueries({ queryKey: invalidate });
      }
    },
  });
}

/* ========= PUT ========= */
export function usePut<TResponse, TBody>(
  api: (body: TBody) => Promise<TResponse>,
  invalidate?: string[]
) {
  const queryClient = useQueryClient();

  return useMutation<TResponse, Error, TBody>({
    mutationFn: api,
    onSuccess: () => {
      if (invalidate) {
        queryClient.invalidateQueries({ queryKey: invalidate });
      }
    },
  });
}

/* ========= DELETE ========= */
export function useDelete<TResponse, TVariables = void>(
  api: (vars: TVariables) => Promise<TResponse>,
  invalidate?: string[]
) {
  const queryClient = useQueryClient();

  return useMutation<TResponse, Error, TVariables>({
    mutationFn: api,
    onSuccess: () => {
      if (invalidate) {
        queryClient.invalidateQueries({ queryKey: invalidate });
      }
    },
  });
}
