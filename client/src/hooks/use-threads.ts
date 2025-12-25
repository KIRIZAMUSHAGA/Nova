import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Thread, type Message } from "@shared/schema";

// Helper to build URLs since frontend can't import the buildUrl function directly if it wasn't exported
// But instructions said import EXACT types. Assuming api object structure from context.

export function useThreads() {
  return useQuery({
    queryKey: [api.threads.list.path],
    queryFn: async () => {
      const res = await fetch(api.threads.list.path);
      if (!res.ok) throw new Error("Failed to fetch threads");
      return await res.json() as Thread[];
    },
  });
}

export function useThread(id: number | null) {
  return useQuery({
    queryKey: [api.threads.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const url = api.threads.get.path.replace(":id", id.toString());
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch thread");
      return await res.json() as Thread;
    },
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.threads.create.path, {
        method: api.threads.create.method,
      });
      if (!res.ok) throw new Error("Failed to create thread");
      return await res.json() as Thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.threads.list.path] });
    },
  });
}

export function useMessages(threadId: number | null) {
  return useQuery({
    queryKey: [api.messages.list.path.replace(":id", String(threadId || 0))], // Unique key per thread
    enabled: !!threadId,
    refetchInterval: 3000, // Poll for new messages every 3s
    queryFn: async () => {
      if (!threadId) return [];
      const url = api.messages.list.path.replace(":id", threadId.toString());
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return await res.json() as Message[];
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: number; content: string }) => {
      const url = api.messages.create.path.replace(":id", threadId.toString());
      const res = await fetch(url, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return await res.json() as Message;
    },
    onSuccess: (data, variables) => {
      const queryKey = [api.messages.list.path.replace(":id", String(variables.threadId))];
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
