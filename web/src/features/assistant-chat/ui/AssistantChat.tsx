import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";

import { assistantApi, type ChatMessage } from "@/entities/assistant";
import { queryKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";

let idCounter = 0;
const nextId = () => `${Date.now()}-${idCounter++}`;

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
        )}
      >
        {message.text}
      </div>
    </div>
  );
}

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: suggestionsData } = useQuery({
    queryKey: queryKeys.assistantSuggestions,
    queryFn: assistantApi.suggestions,
    staleTime: Infinity,
  });

  const askMut = useMutation({
    mutationFn: assistantApi.ask,
    onSuccess: (res) => {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", text: res.answer, at: res.generatedAt },
      ]);
    },
    onError: () => {
      toast.error("Не удалось получить ответ, попробуйте ещё раз");
    },
  });

  // Автоскролл вниз при новых сообщениях / индикаторе печати
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, askMut.isPending]);

  const send = (question: string) => {
    const text = question.trim();
    if (!text || text.length < 3 || askMut.isPending) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text, at: new Date().toISOString() },
    ]);
    setInput("");
    askMut.mutate(text);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const suggestions = suggestionsData?.suggestions ?? [];
  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[560px] flex-col rounded-2xl bg-card shadow-sm ring-1 ring-border/50">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">ИИ-аналитик</h2>
      </div>

      {/* Message feed */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Спросите про посещаемость вашей компании
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Например, про пунктуальность, тренды или самые проблемные дни недели.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {askMut.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-muted">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={askMut.isPending}
              onClick={() => send(s)}
              className={cn(
                "rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors",
                "hover:border-primary hover:bg-primary/5 hover:text-primary",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border px-5 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={300}
          placeholder="Задайте вопрос…"
          className={cn(
            "flex-1 rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
          )}
        />
        <Button type="submit" size="sm" className="gap-1.5" disabled={askMut.isPending || input.trim().length < 3}>
          <Send className="h-3.5 w-3.5" />
          Спросить
        </Button>
      </form>
    </div>
  );
}
