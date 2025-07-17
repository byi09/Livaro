import { NextRequest, NextResponse } from 'next/server';
import { getUserConversationsComplete } from '@/src/db/queries';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import {inArray } from 'drizzle-orm';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    try {
        const supabase: SupabaseClient = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!user || error) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters for filtering and sorting
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const sortBy = searchParams.get('sortBy') || 'newest'; // newest, oldest, unresponded
        const archived = searchParams.get('archived') === 'true';

        console.log('Loading conversations for user:', user.id, { category, sortBy, archived });

        let userConversations = await getUserConversationsComplete(user.id, {
            sortBy,
            archived
        });

        // Filter by category on client side (since we're not modifying DB schema)
        if (category && category !== 'all') {
            userConversations = userConversations.filter(conv => {
                // For now, we'll use property-based categorization
                if (category === 'landlord_inquiry') {
                    return conv.propertyId !== null;
                } else if (category === 'general') {
                    return conv.propertyId === null;
                }
                return true;
            });
        }
        
        console.log(`Found ${userConversations.length} conversations for user`);

        return NextResponse.json(userConversations);

    } catch (error) {
        console.error('Error in GET /api/messaging/conversation:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase: SupabaseClient = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!user || error) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { 
            conversation_type = 'direct', 
            participant_ids = [], 
            content, 
            property_id, 
            title 
        } = body;

        // --- Start of Validation ---
        // 1. Validate that all participant_ids are valid users
        if (participant_ids.length > 0) {
            const usersExist = await db.select({ id: users.id }).from(users).where(inArray(users.id, participant_ids));
            if (usersExist.length !== participant_ids.length) {
                return NextResponse.json({ error: 'One or more participant IDs are invalid.' }, { status: 400 });
            }
        }

        // 2. Validation based on conversation type
        if (conversation_type === 'direct') {
            if (participant_ids.length !== 1) {
                return NextResponse.json({ 
                    error: 'Direct chat needs exactly 1 other participant' 
                }, { status: 400 });
            }
        } else if (conversation_type === 'group') {
            if (participant_ids.length < 2) {
                return NextResponse.json({ 
                    error: 'Group chat needs at least 2 other participants' 
                }, { status: 400 });
            }
            if (!title) {
                return NextResponse.json({ 
                    error: 'Group chat requires a title' 
                }, { status: 400 });
            }
        } else if (conversation_type === 'support') {
            // Support conversations can be created without additional participants (for testing/customer support)
            if (!title) {
                return NextResponse.json({ 
                    error: 'Support conversation requires a title' 
                }, { status: 400 });
            }
        }

        // Create conversation using Supabase client (respects RLS)
        const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
                conversation_type,
                property_id: property_id || null,
                title: conversation_type === 'group' ? title : null,
            })
            .select()
            .single();

        if (convError) {
            console.error('Error creating conversation:', convError);
            throw convError;
        }

        // Prepare participants array
        const participants = [
            // Creator as admin for groups, member for direct
            { 
                conversation_id: newConversation.id, 
                user_id: user.id, 
                role: conversation_type === 'group' ? 'admin' : 'member' 
            },
            // Other participants as members
            ...participant_ids.map((participantId: string) => ({
                conversation_id: newConversation.id,
                user_id: participantId,
                role: 'member'
            }))
        ];

        // Add all participants using Supabase client
        const { error: participantsError } = await supabase
            .from('conversation_participants')
            .insert(participants);

        if (participantsError) {
            console.error('Error adding participants:', participantsError);
            throw participantsError;
        }

        // If initial message provided, add it
        if (content) {
            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: newConversation.id,
                    sender_id: user.id,
                    content,
                    message_type: 'text'
                });

            if (messageError) {
                console.error('Error adding initial message:', messageError);
                // Don't throw - conversation was created successfully
            }
        }

        // Add a welcome message for testing
        const { error: welcomeMessageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: newConversation.id,
                sender_id: user.id,
                content: `Welcome to the conversation! This is the start of your ${conversation_type} chat.`,
                message_type: 'text'
            });

        if (welcomeMessageError) {
            console.error('Error adding welcome message:', welcomeMessageError);
        }

        return NextResponse.json({ 
            conversation: newConversation,
            participants_count: participants.length,
            success: true
        });

    } catch (error) {
        console.error('Error in POST /api/messaging/conversation:', error);
        return NextResponse.json({ 
            error: 'Failed to create conversation',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 