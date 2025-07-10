'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/button'

export default function Chatbox({ conversation }: { conversation: string[] }) {
  return (
    <div className="flex flex-col h-full w-full items-center border-2 m-4 justify-center">
      <div className="mt-4">
        {conversation.map((message, index) => (
          <p key={index} className="text-lg">
            {message}
          </p>
        ))}
      </div>
    </div>
  )
}
