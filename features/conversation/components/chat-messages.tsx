"use client";

import { isTextUIPart, type UIMessage } from "ai";
import type { ChatStatus } from "ai";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { ToolCallList, type ToolCallInfo } from "@/components/ai-elements/tool-call";

function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function getToolCalls(message: UIMessage): ToolCallInfo[] {
  if (!message.parts) return [];

  return message.parts
    .filter((p: any) => p.type.startsWith("tool-"))
    .map((part: any) => {
      const name = part.type.slice(5);
      
      let status: "pending" | "complete" | "error" = "pending";
      if (part.state === "output-available") {
        status = part.output?.error ? "error" : "complete";
      }

      return {
        id: part.toolCallId || `${message.id}-${name}`,
        name,
        args: part.input,
        result: part.output,
        status,
      };
    });
}

type ChatMessagesProps = {
  messages: UIMessage[];
  status: ChatStatus;
};

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const lastMessage = messages.at(-1);
  const isAssistantThinking = 
    lastMessage?.role === "assistant" && 
    getMessageText(lastMessage).length === 0 && 
    getToolCalls(lastMessage).length === 0;

  const isWaiting =
    (status === "submitted" && lastMessage?.role === "user") || 
    isAssistantThinking;

  const activeToolCalls = lastMessage ? getToolCalls(lastMessage) : [];
  const isSearching = activeToolCalls.some((tc) => tc.status === "pending");

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => {
          const toolCalls = getToolCalls(message);
          const hasContent = getMessageText(message).length > 0;

          return (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {toolCalls.length > 0 && (
                  <ToolCallList toolCalls={toolCalls} />
                )}
                {hasContent && (
                  <MessageResponse>{getMessageText(message)}</MessageResponse>
                )}
              </MessageContent>
            </Message>
          );
        })}

        {isWaiting ? (
          <Message from="assistant">
            <MessageContent>
              <Loader isSearching={isSearching} />
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
    </Conversation>
  );
}
