import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession, login, logout } from "./api";

export const sessionKey = ["auth", "session"] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: ({ signal }) => getSession(signal),
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: async (session) => {
      await client.cancelQueries({ queryKey: sessionKey });
      client.setQueryData(sessionKey, session);
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
      client.setQueryData(sessionKey, null);
    },
  });
}
