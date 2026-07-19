"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  createBranch, 
  deleteBranch, 
  listBranches, 
  renameBranch 
} from "../actions/branch-actions";
import { 
  getBranchTree, 
  getMessagePath 
} from "../actions/branch-queries";
import { queryKeys } from "@/features/conversation/utils/query-keys";

const branchKeys = {
  branches: (messageId: string) => ["branches", messageId] as const,
  messagePath: (messageId: string) => ["message-path", messageId] as const,
  branchTree: (conversationId: string) => ["branch-tree", conversationId] as const,
};

export function useBranches(messageId: string) {
  return useQuery({
    queryKey: branchKeys.branches(messageId),
    queryFn: () => listBranches(messageId),
    enabled: Boolean(messageId),
  });
}

export function useMessagePath(messageId: string) {
  return useQuery({
    queryKey: branchKeys.messagePath(messageId),
    queryFn: () => getMessagePath(messageId),
    enabled: Boolean(messageId),
  });
}

export function useBranchTree(conversationId: string) {
  return useQuery({
    queryKey: branchKeys.branchTree(conversationId),
    queryFn: () => getBranchTree(conversationId),
    enabled: Boolean(conversationId),
  });
}

export function useCreateBranch(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, newUserMessage }: { messageId: string; newUserMessage: string }) =>
      createBranch(messageId, newUserMessage),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byConversation(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["branch-tree", conversationId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create branch");
    },
  });
}

export function useRenameBranch(conversationId: string, messageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newName: string) => renameBranch(messageId, newName),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: branchKeys.branches(messageId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to rename branch");
    },
  });
}

export function useDeleteBranch(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => deleteBranch(messageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byConversation(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["branch-tree", conversationId],
      });
      toast.success("Branch deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete branch");
    },
  });
}
