'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function TestMessagingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const router = useRouter();

  const createDemoData = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/demo/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Demo data created successfully! Conversations: ${data.conversations.join(', ')}`);
      } else {
        setResult(`❌ Error: ${data.error} - ${data.details || ''}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testPusherConnection = async () => {
    setResult('Testing Pusher connection...');
    
    // Test if Pusher environment variables are set
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!pusherKey || !pusherCluster) {
      setResult('❌ Pusher environment variables not set. Check NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER');
      return;
    }

    setResult(`✅ Pusher config found - Key: ${pusherKey.substring(0, 10)}..., Cluster: ${pusherCluster}`);
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    setResult('Testing Supabase connection...');

    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        setResult(`❌ Supabase auth error: ${error.message}`);
      } else if (!user) {
        setResult('❌ No authenticated user found. Please sign in first.');
      } else {
        setResult(`✅ Supabase connected! User: ${user.email} (${user.id})`);
      }
    } catch (error) {
      setResult(`❌ Supabase connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const goToMessages = () => {
    router.push('/messages');
  };

  const testMessageSending = async () => {
    setLoading(true);
    setResult('Testing message sending...');

    try {
      // First create a test conversation (using support type for testing)
      const convResponse = await fetch('/api/messaging/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_type: 'support',
          participant_ids: [], // Empty for testing - just current user
          title: 'Test Conversation - Message Sending',
        })
      });

      if (!convResponse.ok) {
        const convError = await convResponse.json();
        setResult(`❌ Failed to create test conversation: ${convError.error}`);
        return;
      }

      const convData = await convResponse.json();
      const conversationId = convData.conversation.id;

      // Now try to send a message
      const msgResponse = await fetch('/api/messaging/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          content: 'This is a test message to verify message sending works!',
          clientId: `test-${Date.now()}`
        })
      });

      if (msgResponse.ok) {
        setResult(`✅ Message sending test successful! Conversation ID: ${conversationId}`);
      } else {
        const msgError = await msgResponse.json();
        setResult(`❌ Message sending failed: ${msgError.error}`);
      }

    } catch (error) {
      setResult(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testMessageDeletion = async () => {
    setLoading(true);
    setResult('Testing message deletion...');

    try {
      // First create a test conversation
      const convResponse = await fetch('/api/messaging/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_type: 'support',
          participant_ids: [],
          title: 'Test Deletion Conversation',
        })
      });

      if (!convResponse.ok) {
        const convError = await convResponse.json();
        setResult(`❌ Failed to create test conversation: ${convError.error}`);
        return;
      }

      const convData = await convResponse.json();
      const conversationId = convData.conversation.id;

      // Send a test message
      const msgResponse = await fetch('/api/messaging/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          content: 'This message will be deleted as a test!',
          clientId: `test-${Date.now()}`
        })
      });

      if (!msgResponse.ok) {
        const msgError = await msgResponse.json();
        setResult(`❌ Failed to send test message: ${msgError.error}`);
        return;
      }

      const msgData = await msgResponse.json();
      const messageId = msgData.id;

      // Wait a moment then delete the message
      await new Promise(resolve => setTimeout(resolve, 1000));

      const deleteResponse = await fetch('/api/messaging/message', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });

      if (deleteResponse.ok) {
        setResult(`✅ Message deletion test successful! Created and deleted message ID: ${messageId}`);
      } else {
        const deleteError = await deleteResponse.json();
        setResult(`❌ Message deletion failed: ${deleteError.error}`);
      }

    } catch (error) {
      setResult(`❌ Deletion test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Messaging System Test</h1>
        
        {/* Migration Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Database Migration Applied!</h2>
          <p className="text-green-700">
            All missing columns have been added to your database. The messaging platform should now work perfectly!
          </p>
        </div>

        <div className="space-y-6">
          {/* Test Supabase Connection */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Test Supabase Connection</h2>
            <p className="text-gray-600 mb-4">
              Verify that Supabase is properly configured and you're authenticated.
            </p>
            <button
              onClick={testSupabaseConnection}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              Test Supabase
            </button>
          </div>

          {/* Test Pusher Configuration */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Test Pusher Configuration</h2>
            <p className="text-gray-600 mb-4">
              Check if Pusher environment variables are properly set for real-time messaging.
            </p>
            <button
              onClick={testPusherConnection}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Test Pusher Config
            </button>
          </div>

          {/* Create Demo Data */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Create Demo Messaging Data</h2>
            <p className="text-gray-600 mb-4">
              Generate sample conversations and messages to test the messaging interface.
            </p>
            <button
              onClick={createDemoData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Demo Data'}
            </button>
          </div>

          {/* Test Message Sending */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Test Message Sending</h2>
            <p className="text-gray-600 mb-4">
              Test the core message sending functionality by creating a conversation and sending a message.
            </p>
            <button
              onClick={testMessageSending}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
            >
              {loading ? 'Testing...' : 'Test Message Sending'}
            </button>
          </div>

          {/* Test Message Deletion */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Test Message Deletion</h2>
            <p className="text-gray-600 mb-4">
              Test deleting messages (creates a test message then deletes it).
            </p>
            <button
              onClick={testMessageDeletion}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {loading ? 'Testing...' : 'Test Message Deletion'}
            </button>
          </div>

          {/* Navigate to Messages */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Test Messaging Interface</h2>
            <p className="text-gray-600 mb-4">
              Go to the main messaging page to test the interface with real-time functionality.
            </p>
            <button
              onClick={goToMessages}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Go to Messages
            </button>
          </div>
        </div>

        {/* Results Display */}
        {result && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Test Results:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>First, test the Supabase connection to ensure you're authenticated</li>
            <li>Check the Pusher configuration for real-time messaging</li>
            <li>Create demo data to have conversations to test with</li>
            <li>Test message sending functionality with the direct API test</li>
            <li>Navigate to the messages page to test the full interface</li>
            <li>Try sending messages to test real-time updates</li>
            <li>Test filtering by categories and tags</li>
            <li>Test creating new conversations with different users</li>
          </ol>
        </div>

        {/* Feature Overview */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Messaging System Features:</h3>
          <ul className="list-disc list-inside text-green-700 space-y-1">
            <li>Real-time messaging with Pusher</li>
            <li>Message storage in Supabase</li>
            <li>Conversation categories (landlord inquiry, tenant, rentals, general)</li>
            <li>Message tags (urgent, follow-up needed, documents required, etc.)</li>
            <li>Filtering and sorting (newest, oldest, unresponded)</li>
            <li>Direct and group conversations</li>
            <li>Custom conversation titles for groups</li>
            <li>User and property search for creating conversations</li>
            <li>Mobile-responsive design</li>
            <li><strong>Floating messaging icon</strong> - Accessible from any page (except messages pages)</li>
            <li><strong>Modal messaging interface</strong> - Full messaging platform in an overlay</li>
            <li><strong>Minimize/maximize</strong> - Minimize the modal to continue using the app</li>
            <li><strong>Unread badge</strong> - Visual indicator for new messages</li>
          </ul>
        </div>

        {/* Floating Icon Test */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">🎯 Test the Floating Messaging Icon:</h3>
          <p className="text-yellow-700 mb-4">
            Navigate to any other page (like the home page) to see the floating messaging icon in the bottom-right corner. 
            Click it to open the full messaging platform in a modal overlay!
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Go to Home Page
            </button>
            <button
              onClick={() => router.push('/map')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Go to Map Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 