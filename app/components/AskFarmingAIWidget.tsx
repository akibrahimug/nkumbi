"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, User, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/app/components/ui/use-toast";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
}

export default function AskFarmingAIWidget() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const widgetRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const expandChat = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  }, [isExpanded]);

  const minimizeChat = useCallback(() => {
    if (isExpanded && messages.length === 0) {
      setIsExpanded(false);
    }
  }, [isExpanded, messages.length]);

  // Close widget when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        minimizeChat();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [minimizeChat]);

  // Auto-expand when new messages arrive (without auto-scrolling)
  useEffect(() => {
    if (messages.length > 0) {
      expandChat();
    }
  }, [messages.length, expandChat]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.result.generated_text,
        sender: "ai",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I encountered an error. Please try again.",
          sender: "ai",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Optional: Prevent page scroll when hovering over the messages area
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        chatContainer.scrollTop += event.deltaY;
      };
      chatContainer.addEventListener("wheel", handleWheel);
      return () => chatContainer.removeEventListener("wheel", handleWheel);
    }
  }, []);

  return (
    <div
      ref={widgetRef}
      style={{ overflowAnchor: "none" }} // disable scroll anchoring
      className={cn(
        "flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 transition-all duration-300 ease-in-out"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/ai-avatar.png" alt="AI" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">Farming AI Assistant</h2>
            <p className="text-sm text-gray-500">
              Ask me anything about farming
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Chat Messages Area (only visible when expanded) */}
      {isExpanded && (
        <div
          ref={chatContainerRef}
          style={{ overflowAnchor: "none" }}
          className="p-4 space-y-4 overflow-y-auto max-h-[400px]"
        >
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 mt-8">
              <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
              <p>Ask any farming-related question to get started!</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div className="flex items-start max-w-[80%] space-x-2">
                {message.sender === "ai" && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/ai-avatar.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    message.sender === "user"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  {message.sender === "user" ? (
                    <p>{message.content}</p>
                  ) : (
                    <div
                      className="ai-response"
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                  )}
                </div>
                {message.sender === "user" && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/user-avatar.png" alt="User" />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/ai-avatar.png" alt="AI" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="flex space-x-2">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Form (always visible) */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-4 border-t border-gray-200"
      >
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          // If not expanded, click expands the chat and focuses input without scrolling
          onMouseDown={(e) => {
            if (!isExpanded) e.preventDefault();
          }}
          onClick={(e) => {
            if (!isExpanded) {
              e.currentTarget.focus({ preventScroll: true });
              expandChat();
            }
          }}
          placeholder="Ask a farming question..."
          className="flex-grow py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isLoading}
          ref={inputRef}
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 transition-colors duration-200"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
