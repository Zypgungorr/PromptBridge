"use client";

import { Bot, User, Copy, Check } from "lucide-react";
import ChatInput from "./ChatInput";

import type { AIProvider, ChatMessage } from "@/types/dashboard";

interface ChatAreaProps {
  selectedProvider: string | null;
  providers: AIProvider[];
  messages: ChatMessage[];
  inputMessage: string;
  isLoading: boolean;
  copiedMessageId: string | null;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onCopyMessage: (text: string, messageId: string) => void;
}

export default function ChatArea({
  selectedProvider,
  providers,
  messages,
  inputMessage,
  isLoading,
  copiedMessageId,
  onInputChange,
  onSendMessage,
  onCopyMessage,
}: ChatAreaProps) {
  const getProviderInfo = (providerId: string | null) => {
    if (!providerId) return null;
    return providers.find((p) => p.id === providerId);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center">
          <h1 className="text-lg font-medium text-gray-600 dark:text-gray-300">
            Model: {getProviderInfo(selectedProvider)?.name || "N/A"}
          </h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Sohbet başlatın
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {selectedProvider
                ? `${
                    getProviderInfo(selectedProvider)?.name
                  } ile konuşmaya başlayın`
                : "Önce bir AI servisi seçin"}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`border-b border-gray-100 dark:border-gray-800 ${
                message.role === "assistant"
                  ? "bg-gray-50 dark:bg-gray-800/50"
                  : ""
              }`}
            >
              <div className="max-w-4xl mx-auto px-6 py-6">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm dark:text-gray-400">
                        {message.role === "user"
                          ? "You:"
                          : `AI (${message.providerName || "Unknown"}):`}
                      </span>
                      {message.role === "assistant" && (
                        <button
                          onClick={() =>
                            onCopyMessage(message.content, message.id)
                          }
                          className="ml-auto p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {/* Loading state */}
        {isLoading && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 ">
                    <span className="font-semibold text-sm dark:text-gray-400">
                      AI:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatInput
        inputMessage={inputMessage}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        selectedProvider={selectedProvider}
        providers={providers}
        messages={messages}
        isLoading={isLoading}
      />
    </div>
  );
}
