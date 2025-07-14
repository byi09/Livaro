'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface ChatboxProps {
  initialMessage: string
  onSubmit: (
    formData: FormData
  ) => Promise<{ response?: string; error?: string }>
}

export default function Chatbox({
  initialMessage,
  onSubmit,
}: ChatboxProps) {
  const [messages, setMessages] = useState([initialMessage])
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    const prompt = formData.get('prompt') as string
    if (!prompt.trim()) return

    setMessages(prev => [...prev, `You: ${prompt}`])
    setIsLoading(true)

    try {
      const result = await onSubmit(formData)

      if (result.response) {
        setMessages(prev => [
          ...prev,
          `AI: ${result.response}`,
        ])
      } else if (result.error) {
        setMessages(prev => [
          ...prev,
          `Error: ${result.error}`,
        ])
      }
    } catch (error) {
      setMessages(prev => [...prev, `Error: ${error}`])
    } finally {
      setIsLoading(false)
    }

    const form = document.querySelector(
      'form'
    ) as HTMLFormElement
    form?.reset()
  }

  return (
    <div className="flex flex-col h-full w-full items-center border-2 m-4 justify-between p-4">
      <div className="self-start w-full flex-1 overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <p key={index} className="text-lg mb-2">
            {message}
          </p>
        ))}
        {isLoading && (
          <p className="text-lg text-gray-500">
            AI is thinking...
          </p>
        )}
      </div>
      <form
        action={handleSubmit}
        className="w-full flex gap-2"
      >
        <Input
          name="prompt"
          placeholder="Enter your query..."
          required
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  )
}
