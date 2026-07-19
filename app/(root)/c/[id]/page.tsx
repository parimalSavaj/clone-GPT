import { loadChatMessages } from '@/features/ai';
import { getConversation } from '@/features/conversation/actions/conversation-actions';
import { ConversationView } from '@/features/conversation/components/conversation-view';
import { notFound } from 'next/navigation';
import React from 'react'

type ConversationPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ m?: string }>;
};

/**
 * Conversation page — loads messages and renders the chat UI for a given ID.
 */
const page = async({ params, searchParams }: ConversationPageProps) => {
    const { id } = await params;
    const { m } = await searchParams;

    try {
      await getConversation(id)
    } catch (error) {
      notFound()
    }

    const initialMessages = await loadChatMessages(id, m);

    return (
      <ConversationView
        key={`${id}-${m || "active"}`}
        conversationId={id}
        initialMessages={initialMessages}
      />
    )
}

export default page
