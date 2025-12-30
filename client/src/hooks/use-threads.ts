import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Thread, type Message } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useThreads() {
  return useQuery({
    queryKey: [api.threads.list.path],
    queryFn: async () => {
      const res = await apiRequest("GET", api.threads.list.path);
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
      const res = await apiRequest("GET", url);
      return await res.json() as Thread;
    },
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest(api.threads.create.method, api.threads.create.path);
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
      const res = await apiRequest("GET", url);
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
      attachment,
      onChunk 
    }: { 
      threadId: string; 
      content: string;
      attachment?: string;
      onChunk?: (chunk: string) => void;
    }) => {
      const url = api.messages.create.path.replace(":id", threadId);
      const res = await apiRequest(api.messages.create.method, url, { content, attachment });
      
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
