import { AIChatRequest } from './types'

export async function getFilters(prompt: string) {
  // sample prompt:
  // "Hello, could you please help me find a place to rent in San Francisco? I'm looking for a 1-bedroom apartment with a budget of $3000 per month. Ideally, it should be pet-friendly and close to public transport. Thanks!",
  const payload: AIChatRequest = {
    prompt: prompt,
  }

  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const res = await fetch(`${baseURL}/api/query-to-filter`, {
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
  return data
}
