import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Thread, type Message } from "@shared/schema";

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

export function useThread(id: string | null) {
  return useQuery({
    queryKey: [api.threads.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const url = api.threads.get.path.replace(":id", id);
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

export function useMessages(threadId: string | null) {
  return useQuery({
    queryKey: [api.messages.list.path, threadId], 
    enabled: !!threadId,
    refetchInterval: 3000, 
    queryFn: async () => {
      if (!threadId) return [];
      const url = api.messages.list.path.replace(":id", threadId);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return await res.json() as Message[];
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      threadId, 
      content,
      onChunk 
    }: { 
      threadId: string; 
      content: string;
      onChunk?: (chunk: string) => void;
    }) => {
      const url = api.messages.create.path.replace(":id", threadId);
      const res = await fetch(url, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullResponse += data.content;
                  onChunk?.(data.content);
                }
              } catch (e) {}
            }
          }
        }
      }

      return { role: "assistant", content: fullResponse } as Message;
    },
    onSuccess: (data, variables) => {
      const queryKey = [api.messages.list.path, variables.threadId];
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
