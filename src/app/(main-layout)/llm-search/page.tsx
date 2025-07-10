import Chatbox from './chatbox'
import { AIChatRequest } from './types'

export default async function TempPage() {
  const payload: AIChatRequest = {
    prompt: 'Hello, how can I help you today?',
  }

  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const res = await fetch(`${baseURL}/api/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  const data = await res.json()
  console.log(data)

  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <h1 className="text-2xl font-bold">LLM Search</h1>
      <Chatbox conversation={['Hello, how can I help you today?']} />
    </div>
  )
}
