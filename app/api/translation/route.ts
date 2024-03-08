import { openai } from '@/app/lib/openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | undefined

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file
  })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: 'Translate this into Spanish: ' + response.text }],
    stream: true
  })

  const stream = OpenAIStream(completion)
  // Respond with the stream
  return new StreamingTextResponse(stream)
}
