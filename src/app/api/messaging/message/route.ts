import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/src/db';
import { messages, conversationParticipants, users, customers, conversations } from '@/src/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { pusherServer } from '@/src/lib/pusher';
import { userHasConversationAccess } from '@/src/db/queries';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = request.nextUrl.searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const participation = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, user.id),
        eq(conversationParticipants.isActive, true)
      ),
    });

    if (!participation) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const conversationMessages = await db.select({
        id: messages.id, content: messages.content, messageType: messages.messageType,
        senderId: messages.senderId, createdAt: messages.createdAt, isEdited: messages.isEdited,
        replyToId: messages.replyToId,
        sender: { id: users.id, username: users.username, firstName: customers.firstName, lastName: customers.lastName }
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .innerJoin(customers, eq(users.id, customers.userId))
      .where(and(eq(messages.conversationId, conversationId), eq(messages.isDeleted, false)))
      .orderBy(desc(messages.createdAt))
      .limit(50);

    return NextResponse.json(conversationMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content, clientId } = await request.json();

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Missing conversationId or content' }, { status: 400 });
    }

    if (!(await userHasConversationAccess(user.id, conversationId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Insert message with basic required fields only (for compatibility)
    const messageData: any = {
      conversationId,
      senderId: user.id,
      content,
      messageType: 'text',
    };

    const [newMessage] = await db.insert(messages).values(messageData).returning();
    
    // Try to update with additional fields if they exist
    try {
      await db.update(messages)
        .set({ 
          isDeleted: false,
          isEdited: false,
          updatedAt: new Date()
        })
        .where(eq(messages.id, newMessage.id));
    } catch (error) {
      // Ignore errors for missing columns - they may not exist yet
      console.log('Some optional columns may not exist yet:', error);
    }

    const messageWithSender = await db.query.messages.findFirst({
        where: eq(messages.id, newMessage.id),
        with: { sender: { with: { customer: true } } }
    });

    // Add clientId to the broadcast payload if it exists
    const broadcastPayload = { ...messageWithSender, clientId };

    // 1. Trigger event for the active conversation channel
    await pusherServer.trigger(
      `private-conversation-${conversationId}`,
      'new-message',
      broadcastPayload
    );

    // 2. Get all participants to notify them (including the sender for multi-device sync)
    const allParticipants = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.conversationId, conversationId),
    });

    // 3. Trigger an event for each participant so their conversation list updates
    for (const participant of allParticipants) {
        await pusherServer.trigger(
            `private-user-${participant.userId}`,
            'conversation-update',
            {
                conversationId: conversationId,
                lastMessage: broadcastPayload,
            }
        );
    }
    
    // Also update the conversation's "updatedAt" to move it to the top of the list
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json(messageWithSender);
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      // Check for specific database errors
      if (error.message.includes('column "tags" of relation "messages" does not exist')) {
        return NextResponse.json({ 
          error: 'Database schema issue: Missing tags column. Please run the latest database migration.',
          details: 'Contact support to update database schema'
        }, { status: 500 });
      }
      
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json({ 
          error: 'Invalid conversation or user reference',
          details: error.message
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to send message', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId } = body;

    console.log('🗑️ Delete request received:', { messageId, userId: user.id });

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // First, get the message to verify permissions
    const messageToDelete = await db.query.messages.findFirst({
      where: and(
        eq(messages.id, messageId),
        eq(messages.isDeleted, false)
      ),
    });

    console.log('📋 Message to delete:', messageToDelete);

    if (!messageToDelete) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user has permission to delete this message
    if (messageToDelete.senderId !== user.id) {
      console.log('❌ Permission denied:', { messageSenderId: messageToDelete.senderId, userId: user.id });
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }

    // Verify user has access to the conversation
    const hasAccess = await userHasConversationAccess(user.id, messageToDelete.conversationId);
    if (!hasAccess) {
      console.log('❌ Conversation access denied');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('✅ Permissions verified, proceeding with delete');

    // Soft delete the message
    try {
      const [deletedMessage] = await db
        .update(messages)
        .set({ 
          isDeleted: true, 
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(messages.id, messageId))
        .returning();

      console.log('✅ Message soft deleted:', deletedMessage);

      // Get all conversation participants for real-time updates
      const allParticipants = await db.select({
        userId: conversationParticipants.userId,
      })
      .from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, messageToDelete.conversationId),
        eq(conversationParticipants.isActive, true)
      ));

      console.log('👥 Participants to notify:', allParticipants);

      // Trigger real-time event for message deletion
      for (const participant of allParticipants) {
        try {
          await pusherServer.trigger(
            `private-user-${participant.userId}`,
            'message-deleted',
            {
              messageId: messageId,
              conversationId: messageToDelete.conversationId,
              deletedBy: user.id,
            }
          );
          console.log('📡 Pusher event sent to user:', participant.userId);
        } catch (pusherError) {
          console.error('❌ Pusher error for user:', participant.userId, pusherError);
        }
      }

      return NextResponse.json({ 
        success: true, 
        messageId: messageId,
        deletedMessage
      });

    } catch (dbError) {
      console.error('❌ Database error during delete:', dbError);
      return NextResponse.json({ 
        error: 'Database error during delete',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error deleting message:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
