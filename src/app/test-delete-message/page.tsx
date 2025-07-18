"use client";

import { useState } from 'react';

export default function TestDeleteMessage() {
  const [messageId, setMessageId] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testDelete = async () => {
    if (!messageId) {
      setResult('Please enter a message ID');
      return;
    }

    setLoading(true);
    setResult('Testing delete...');

    try {
      console.log('🗑️ Testing delete for message:', messageId);
      
      const response = await fetch('/api/messaging/message', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });

      console.log('📡 Delete response status:', response.status);
      const data = await response.json();
      console.log('📡 Delete response data:', data);

      if (response.ok) {
        setResult(`✅ Delete successful! Message ID: ${messageId}\nResponse: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Delete failed: ${data.error || 'Unknown error'}\nDetails: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetMessage = async () => {
    if (!messageId) {
      setResult('Please enter a message ID');
      return;
    }

    setLoading(true);
    setResult('Testing get message...');

    try {
      // First get the conversation ID by trying to get the message
      const response = await fetch(`/api/messaging/message?conversationId=test`, {
        method: 'GET',
      });

      if (response.ok) {
        const messages = await response.json();
        setResult(`✅ Found ${messages.length} messages in conversation\nMessages: ${JSON.stringify(messages.slice(0, 3), null, 2)}`);
      } else {
        const error = await response.json();
        setResult(`❌ Failed to get messages: ${error.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Message Deletion</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Message ID:</label>
          <input
            type="text"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            placeholder="Enter message ID to delete"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={testDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Delete'}
          </button>
          
          <button
            onClick={testGetMessage}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Get Messages'}
          </button>
        </div>
        
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
            {result || 'No result yet'}
          </pre>
        </div>
      </div>
    </div>
  );
} 