"use client";

import { isTextUIPart, type UIMessage } from "ai";
import type { ChatStatus } from "ai";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { PencilIcon, XIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { ToolCallList, type ToolCallInfo } from "@/components/ai-elements/tool-call";
import { useCreateBranch } from "@/features/messages";

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

// Walks down the hierarchy to the leaf descendant
function getLeafMessageId(messageId: string, allMessages: any[]): string {
  let currentId = messageId;
  while (true) {
    const children = allMessages.filter((m) => m.parentId === currentId);
    if (children.length === 0) break;
    const mainChild = children.find((c) => c.isMainBranch);
    currentId = mainChild?.id || children[0].id;
  }
  return currentId;
}

type ChatMessagesProps = {
  messages: UIMessage[];
  status: ChatStatus;
  allMessages: any[];
  conversationId: string;
};

export function ChatMessages({ messages, status, allMessages, conversationId }: ChatMessagesProps) {
  const router = useRouter();
  const createBranchMutation = useCreateBranch(conversationId);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

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

  // Keyboard Shortcuts navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Look for Alt + ArrowLeft or Alt + ArrowRight
      if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) {
        return;
      }

      // Find the last message step that has multiple sibling options
      const branchedSteps = messages
        .map((message) => {
          const dbMsg = allMessages.find((m) => m.id === message.id);
          const parentId = dbMsg?.parentId ?? null;
          const siblings = allMessages.filter((m) => m.parentId === parentId);
          const currentIdx = siblings.findIndex((s) => s.id === message.id);
          return { message, siblings, currentIdx };
        })
        .filter((step) => step.siblings.length > 1 && step.currentIdx !== -1);

      const targetStep = branchedSteps.at(-1);
      if (!targetStep) return;

      e.preventDefault();
      const { siblings, currentIdx } = targetStep;

      if (e.key === "ArrowLeft") {
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : siblings.length - 1;
        const leafId = getLeafMessageId(siblings[prevIdx].id, allMessages);
        toast.info(`Switched to Branch ${prevIdx + 1}`);
        router.push(`/c/${conversationId}?m=${leafId}`);
      } else if (e.key === "ArrowRight") {
        const nextIdx = currentIdx < siblings.length - 1 ? currentIdx + 1 : 0;
        const leafId = getLeafMessageId(siblings[nextIdx].id, allMessages);
        toast.info(`Switched to Branch ${nextIdx + 1}`);
        router.push(`/c/${conversationId}?m=${leafId}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [messages, allMessages, conversationId, router]);

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => {
          const toolCalls = getToolCalls(message);
          const hasContent = getMessageText(message).length > 0;
          const isEditing = editingMessageId === message.id;

          // Find sibling branches for this message by looking up the database record
          const dbMsg = allMessages.find((m) => m.id === message.id);
          const parentId = dbMsg?.parentId ?? null;
          const siblings = allMessages.filter((m) => m.parentId === parentId);
          const currentIdx = siblings.findIndex((s) => s.id === message.id);
          const hasMultipleBranches = siblings.length > 1 && currentIdx !== -1;

          const handlePrevBranch = () => {
            if (!hasMultipleBranches) return;
            const prevIdx = currentIdx > 0 ? currentIdx - 1 : siblings.length - 1;
            const leafId = getLeafMessageId(siblings[prevIdx].id, allMessages);
            toast.info(`Switched to Branch ${prevIdx + 1}`);
            router.push(`/c/${conversationId}?m=${leafId}`);
          };

          const handleNextBranch = () => {
            if (!hasMultipleBranches) return;
            const nextIdx = currentIdx < siblings.length - 1 ? currentIdx + 1 : 0;
            const leafId = getLeafMessageId(siblings[nextIdx].id, allMessages);
            toast.info(`Switched to Branch ${nextIdx + 1}`);
            router.push(`/c/${conversationId}?m=${leafId}`);
          };

          const handleStartEdit = () => {
            setEditingMessageId(message.id);
            setEditContent(getMessageText(message));
          };

          const handleSaveEdit = async () => {
            if (!editContent.trim()) return;
            try {
              const newMsg = await createBranchMutation.mutateAsync({
                messageId: message.id,
                newUserMessage: editContent
              });
              setEditingMessageId(null);
              toast.success("Branched conversation path successfully!");
              // Navigate to the newly branched message leaf
              const leafId = getLeafMessageId(newMsg.id, allMessages);
              router.push(`/c/${conversationId}?m=${leafId}`);
            } catch (err) {
              console.error(err);
            }
          };

          return (
            <Message key={message.id} from={message.role}>
              <MessageContent className={isEditing ? "w-full max-w-full" : ""}>
                {toolCalls.length > 0 && (
                  <ToolCallList toolCalls={toolCalls} />
                )}

                {isEditing ? (
                  <div className="flex w-full flex-col gap-2 min-w-[300px]">
                    <Textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] w-full resize-y text-foreground bg-transparent"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingMessageId(null)}>
                        <XIcon className="mr-1 h-3.5 w-3.5" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} disabled={createBranchMutation.isPending}>
                        <CheckIcon className="mr-1 h-3.5 w-3.5" />
                        Save & Submit
                      </Button>
                    </div>
                  </div>
                ) : (
                  hasContent && (
                    <MessageResponse>{getMessageText(message)}</MessageResponse>
                  )
                )}

                <MessageToolbar>
                  {hasMultipleBranches ? (
                    <ButtonGroup>
                      <Button variant="ghost" size="icon-sm" onClick={handlePrevBranch}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                      </Button>
                      <ButtonGroupText className="border-none bg-transparent text-muted-foreground shadow-none">
                        {currentIdx + 1} of {siblings.length}
                      </ButtonGroupText>
                      <Button variant="ghost" size="icon-sm" onClick={handleNextBranch}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                      </Button>
                    </ButtonGroup>
                  ) : <div />}

                  {!isEditing && message.role === "user" && (
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      onClick={handleStartEdit}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </MessageToolbar>
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
