import { openai } from '@/app/lib/openai'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { text } = (await req.json()) as { text?: string }

  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    input: text.slice(0, 4096),
    voice: 'echo'
  })

  const arrayBuffer = await mp3.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const base64 = buffer.toString('base64')

  return NextResponse.json({ base64 })
}
