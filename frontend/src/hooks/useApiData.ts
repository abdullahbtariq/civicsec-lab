import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { type PaginatedResponse, unwrapResults } from "../types/api";

type DataState<T> = {
  data: T;
  isLoading: boolean;
  error: string | null;
};

export function useApiList<T>(path: string) {
  const [state, setState] = useState<DataState<T[]>>({
    data: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      try {
        const response = await api.get<T[] | PaginatedResponse<T>>(path, {
          signal: controller.signal,
        });
        setState({ data: unwrapResults(response), isLoading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          data: [],
          isLoading: false,
          error: error instanceof Error ? error.message : "Could not load data.",
        });
      }
    }

    void loadData();

    return () => controller.abort();
  }, [path]);

  return state;
}

export function useApiItem<T>(path: string | null) {
  const [state, setState] = useState<DataState<T | null>>({
    data: null,
    isLoading: Boolean(path),
    error: null,
  });

  useEffect(() => {
    if (!path) {
      setState({ data: null, isLoading: false, error: "Missing identifier." });
      return;
    }

    const requestPath = path;
    const controller = new AbortController();

    async function loadData() {
      setState({ data: null, isLoading: true, error: null });
      try {
        const response = await api.get<T>(requestPath, { signal: controller.signal });
        setState({ data: response, isLoading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Could not load data.",
        });
      }
    }

    void loadData();

    return () => controller.abort();
  }, [path]);

  return state;
}
