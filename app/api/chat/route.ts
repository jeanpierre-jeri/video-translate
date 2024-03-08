import { OpenAIStream, StreamingTextResponse } from 'ai'
import { openai } from '@/app/lib/openai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    stream: true,
    messages
  })

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response)
  // Respond with the stream
  return new StreamingTextResponse(stream)
}
