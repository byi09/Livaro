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
      const response = await fetch('/api/messaging/message', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Delete successful! Message ID: ${messageId}`);
      } else {
        setResult(`❌ Delete failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Test Message Delete</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Message ID:</label>
          <input
            type="text"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            placeholder="Enter message ID to delete"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          onClick={testDelete}
          disabled={loading || !messageId}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-300"
        >
          {loading ? 'Testing...' : 'Test Delete'}
        </button>
        
        {result && (
          <div className={`p-3 rounded-md ${
            result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
} 