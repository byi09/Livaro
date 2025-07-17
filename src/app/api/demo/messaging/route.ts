import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create demo conversations using Supabase client
    
    // Demo conversation 1: Property inquiry
    const { data: conversation1, error: conv1Error } = await supabase
      .from('conversations')
      .insert({
        conversation_type: 'direct',
        title: null, // Direct message - no title needed
      })
      .select()
      .single();

    if (conv1Error) {
      console.error('Error creating conversation 1:', conv1Error);
      throw conv1Error;
    }

    // Add participants to conversation 1 (current user + a demo landlord)
    const { error: part1Error } = await supabase
      .from('conversation_participants')
      .insert([
        {
          conversation_id: conversation1.id,
          user_id: user.id,
          role: 'member'
        },
        // Note: In a real scenario, we'd have other users in the system
        // For demo purposes, we'll just add the current user
      ]);

    if (part1Error) {
      console.error('Error adding participants to conversation 1:', part1Error);
    }

    // Add demo messages to conversation 1
    const demoMessages = [
      {
        conversation_id: conversation1.id,
        sender_id: user.id,
        content: "Hi! I'm interested in the apartment at 123 Main Street. Is it still available?",
        message_type: 'text'
        // tags: JSON.stringify(['landlord_inquiry', 'viewing_scheduled']) // Temporarily disabled until migration is applied
      },
      {
        conversation_id: conversation1.id,
        sender_id: user.id,
        content: "I'd love to schedule a viewing this weekend if possible.",
        message_type: 'text'
        // tags: JSON.stringify(['follow_up_needed']) // Temporarily disabled until migration is applied
      },
      {
        conversation_id: conversation1.id,
        sender_id: user.id,
        content: "Also, do you allow pets? I have a small dog.",
        message_type: 'text'
        // tags: JSON.stringify(['documents_required']) // Temporarily disabled until migration is applied
      }
    ];

    const { error: msgError } = await supabase
      .from('messages')
      .insert(demoMessages);

    if (msgError) {
      console.error('Error adding demo messages:', msgError);
    }

    // Demo conversation 2: Group chat
    const { data: conversation2, error: conv2Error } = await supabase
      .from('conversations')
      .insert({
        conversation_type: 'group',
        title: 'Downtown Apartment Hunters',
      })
      .select()
      .single();

    if (conv2Error) {
      console.error('Error creating conversation 2:', conv2Error);
    } else {
      // Add current user to group chat
      const { error: part2Error } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation2.id,
          user_id: user.id,
          role: 'admin'
        });

      if (!part2Error) {
        // Add demo messages to group chat
        const groupMessages = [
          {
            conversation_id: conversation2.id,
            sender_id: user.id,
            content: "Hey everyone! I found some great listings in the downtown area. Anyone interested in apartment hunting together?",
            message_type: 'text'
            // tags: JSON.stringify(['general']) // Temporarily disabled until migration is applied
          },
          {
            conversation_id: conversation2.id,
            sender_id: user.id,
            content: "I'm particularly looking for places with parking and pet-friendly policies.",
            message_type: 'text'
            // tags: JSON.stringify(['rental_application']) // Temporarily disabled until migration is applied
          }
        ];

        await supabase
          .from('messages')
          .insert(groupMessages);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demo messaging data created successfully',
      conversations: [conversation1.id, conversation2?.id].filter(Boolean)
    });

  } catch (error) {
    console.error('Error creating demo data:', error);
    return NextResponse.json({ 
      error: 'Failed to create demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 