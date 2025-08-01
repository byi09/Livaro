// always use server actions for POST requests

import { PropertyListing, PropertyFilters } from "./types";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { db } from "@/src/db";
import {
  conversations,
  messages,
  conversationParticipants,
} from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export interface SearchFilters {
  [key: string]: unknown;
}

interface MessageMetadata {
  messageType: "ai_query" | "ai_response";
  timestamp: string;
  searchFilters?: PropertyFilters | SearchFilters;
  propertyListings?: PropertyListing[];
  propertyCount?: number;
}

// helper function to rsolve correct supabase client
async function getSupabaseClient() {
  if (typeof window === "undefined") {
    // server
    return await createServerClient();
  } else {
    // client
    return createBrowserClient();
  }
}

async function getCurrentUser() {
  const supabase = await getSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User not authenticated");
  }

  return user;
}

export async function createAISearchConversation(): Promise<string | null> {
  try {
    const user = await getCurrentUser();

    const [conversation] = await db
      .insert(conversations)
      .values({
        conversationType: "ai_search",
        title: `Property Search - ${new Date().toLocaleDateString()}`,
      })
      .returning();

    // add current user to participant list
    await db.insert(conversationParticipants).values({
      conversationId: conversation.id,
      userId: user.id,
      role: "member",
      isActive: true,
    });

    return conversation.id;
  } catch (error) {
    console.error("Error creating AI search conversation:", error);
    return null;
  }
}

export async function logUserQuery(
  conversationId: string,
  query: string,
  searchFilters?: PropertyFilters | SearchFilters,
): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    const metadata: MessageMetadata = {
      messageType: "ai_query",
      timestamp: new Date().toISOString(),
    };

    if (searchFilters) {
      metadata.searchFilters = searchFilters;
    }

    await db.insert(messages).values({
      conversationId,
      senderId: user.id,
      content: query,
      messageType: "ai_query",
      metadata,
    });

    return true;
  } catch (error) {
    console.error("Error logging user query:", error);
    return false;
  }
}

export async function logAIResponse(
  conversationId: string,
  response: string,
  propertyListings?: PropertyListing[],
  searchFilters?: PropertyFilters | SearchFilters,
): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    const metadata: MessageMetadata = {
      messageType: "ai_response",
      timestamp: new Date().toISOString(),
    };

    if (propertyListings && propertyListings.length > 0) {
      metadata.propertyListings = propertyListings;
      metadata.propertyCount = propertyListings.length;
    }

    if (searchFilters) {
      metadata.searchFilters = searchFilters;
    }

    await db.insert(messages).values({
      conversationId,
      senderId: user.id,
      content: response,
      messageType: "ai_response",
      metadata,
    });

    return true;
  } catch (error) {
    console.error("Error logging AI response:", error);
    return false;
  }
}

export async function getOrCreateAISearchConversation(
  sessionKey?: string,
): Promise<string | null> {
  if (typeof window === "undefined") {
    // temp fix to "window" undefiend error
    return await createAISearchConversation();
  }
  const storageKey = `ai_search_conversation_${sessionKey || "default"}`;
  const existingConversationId = sessionStorage.getItem(storageKey);

  if (existingConversationId) {
    try {
      const user = await getCurrentUser();
      const conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, existingConversationId),
          eq(conversations.conversationType, "ai_search"),
        ),
        with: {
          participants: {
            where: and(
              eq(conversationParticipants.userId, user.id),
              eq(conversationParticipants.isActive, true),
            ),
          },
        },
      });

      if (conversation && conversation.participants.length > 0) {
        return existingConversationId;
      }
    } catch (error) {
      console.error("Error verifying existing conversation:", error);
    }
  }

  const newConversationId = await createAISearchConversation();
  if (newConversationId && typeof window !== "undefined") {
    sessionStorage.setItem(storageKey, newConversationId);
  }

  return newConversationId;
}

// not used anywhere, will be useful for edge cases due to session timeouts if needed
export function clearAISearchConversation(sessionKey?: string): void {
  if (typeof window === "undefined") return;

  const storageKey = `ai_search_conversation_${sessionKey || "default"}`;
  sessionStorage.removeItem(storageKey);
}
