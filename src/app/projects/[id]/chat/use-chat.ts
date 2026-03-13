"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase-browser";

export type ChatMessage = {
  id: string;
  project_id: string;
  sender_name: string;
  content: string;
  created_at: string;
};

export function useChat(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        if (!error && data) {
          setMessages(data as ChatMessage[]);
        }
        setLoading(false);
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`chat:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const incoming = payload.new as ChatMessage;
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [projectId]);

  const sendMessage = useCallback(
    async (senderName: string, content: string) => {
      if (!content.trim()) return;

      const { error } = await supabase.from("chat_messages").insert({
        project_id: projectId,
        sender_name: senderName,
        content: content.trim(),
      });

      return { error };
    },
    [projectId]
  );

  return { messages, loading, sendMessage };
}
