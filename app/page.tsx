'use client'

import type { Message } from 'ai'
import { useChat } from 'ai/react'
import { useEffect, useRef, useState } from 'react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    onFinish: (message) => {
      const { content, role, id, createdAt } = message
      const initialMessages = localStorage.getItem('initialMessages')
      const messages: Message[] = initialMessages ? JSON.parse(initialMessages) : []
      messages.push(
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: input,
          createdAt: new Date()
        },
        {
          id,
          role,
          content,
          createdAt
        }
      )
      localStorage.setItem('initialMessages', JSON.stringify(messages))
    }
  })

  const inputFile = useRef<HTMLInputElement>(null)
  const [audioFile, setAudioFile] = useState<File>()
  const [loading, setLoading] = useState(false)

  const deleteMessages = () => {
    const confirmation = window.confirm('Are you sure you want to delete all messages?')

    if (confirmation) {
      localStorage.removeItem('initialMessages')
      setMessages([])
    }
  }

  const translateFile = async () => {
    if (!audioFile) {
      alert('No file selected')
      return
    }
    const formData = new FormData()
    formData.append('file', audioFile)
    setLoading(true)
    const response = await fetch('/api/translation', {
      method: 'POST',
      body: formData
    })
    setLoading(false)

    const reader = response.body?.getReader()

    if (!reader) return
    const decoder = new TextDecoder()
    let content = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      content += text
      const updatedMessages: Message[] = [
        ...messages,
        {
          role: 'assistant',
          content,
          id: crypto.randomUUID(),
          createdAt: new Date()
        }
      ]
      setMessages(updatedMessages)
    }

    localStorage.setItem(
      'initialMessages',
      JSON.stringify([
        ...messages,
        {
          role: 'assistant',
          content,
          id: crypto.randomUUID(),
          createdAt: new Date()
        }
      ])
    )
  }

  const generateAudio = async () => {
    const lastMessage = messages[messages.length - 1].content ?? ''

    if (!lastMessage) {
      window.alert('No hay historial')
      return
    }

    console.log({ lastMessage })
    setLoading(true)

    const response = await fetch('/api/audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: lastMessage })
    })

    const blob = await response.blob()

    setLoading(false)

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.style.display = 'none'
    link.setAttribute('download', 'message.mp3')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const initialMessages = localStorage.getItem('initialMessages')

    const messages = initialMessages ? JSON.parse(initialMessages) : []

    setMessages(messages)
  }, [setMessages])

  return (
    <div className='grid grid-cols-1 grid-rows-[auto_1fr_auto] gap-4 w-full max-w-xl p-4 mx-auto stretch min-h-dvh max-h-dvh'>
      <div>
        <p>
          Nombre del archivo:{' '}
          {audioFile?.name ?? 'Sube un archivo para extraer el texto del audio!'}
        </p>
        <div className='flex items-center gap-4'>
          <button onClick={translateFile} className='bg-blue-500 px-4 py-2 rounded'>
            Traducir
          </button>
          <button onClick={generateAudio} className='bg-violet-500 px-4 py-2 rounded'>
            Generar audio del ultimo mensaje
          </button>
        </div>
        {audioFile && loading && <p>Cargando...</p>}
      </div>
      <div className='overflow-y-auto py-4 scrollbar pr-2'>
        {messages?.map((m) => (
          <div
            key={m.id}
            className={`whitespace-pre-wrap ${
              m.role === 'assistant' ? ' mt-4' : ''
            } grid grid-cols-[auto_1fr] gap-2`}
          >
            <p>{m.role === 'user' ? '👨🏻‍💻' : '🤖'}</p>
            <p>
              {m.content}
              {m.role === 'assistant' ? (
                <span className='w-full block h-px bg-white/10 rounded-full my-4' />
              ) : null}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className='grid grid-cols-[42px_1fr_42px] gap-2'>
        <button
          onClick={() => inputFile.current?.click()}
          type='button'
          className='text-blue-500 bg-transparent border border-blue-500 rounded-md h-full w-auto aspect-square flex items-center justify-center hover:bg-blue-500 hover:text-neutral-300'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='w-6 h-6'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5'
            />
          </svg>
          <input
            ref={inputFile}
            type='file'
            accept='audio/*; video/*'
            className='hidden pointer-events-none'
            onChange={(e) => {
              const file = e.currentTarget.files?.[0]
              if (file) {
                setAudioFile(file)
              }
            }}
          />
        </button>

        <input
          className='w-full p-2 border border-gray-300 rounded shadow-xl inline-block'
          value={input}
          placeholder='Say something...'
          onChange={handleInputChange}
        />
        <button
          onClick={deleteMessages}
          type='button'
          className='text-red-500 bg-transparent border border-red-500 rounded-md h-full w-auto aspect-square flex items-center justify-center hover:bg-red-500 hover:text-neutral-300'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 485 485'
            fill='currentColor'
          >
            <path d='M67.224 0h350.535v71.81H67.224zM417.776 92.829H67.237V485h350.537V92.829h.002zM165.402 431.447H137.04V146.383h28.362v285.064zm91.287 0h-28.363V146.383h28.363v285.064zm91.281 0h-28.361V146.383h28.361v285.064z' />
          </svg>
        </button>
      </form>
    </div>
  )
}
