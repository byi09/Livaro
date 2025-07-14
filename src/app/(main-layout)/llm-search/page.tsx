import Chatbox from './chatbox'
import { getFilters } from './actions'

export default async function LLMSearchPage() {
  async function handleQuery(formData: FormData) {
    'use server'

    const prompt = formData.get('prompt') as string
    if (!prompt) return { error: 'Prompt is required' }

    try {
      const result = await getFilters(prompt)
      return { response: result.response }
    } catch (error) {
      console.error('Error getting filters:', error)
      return { error: 'Failed to process your query' }
    }
  }

  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <h1 className="text-2xl font-bold">LLM Search</h1>
      <Chatbox
        initialMessage="Hello, how can I help you today?"
        onSubmit={handleQuery}
      />
    </div>
  )
}
