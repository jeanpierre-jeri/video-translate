'use client'

import type { Message } from 'ai'
import { useChat } from 'ai/react'
import { useEffect, useRef, useState } from 'react'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: `${apiUrl}/api/chat`,
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
  const messageInput = useRef<HTMLInputElement>(null)
  const [audioFile, setAudioFile] = useState<File>()
  const [loading, setLoading] = useState({
    status: false,
    type: ''
  })

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
    setLoading({
      status: true,
      type: 'file'
    })
    const response = await fetch(`${apiUrl}/api/translation`, {
      method: 'POST',
      body: formData
    })
    setLoading({
      status: false,
      type: ''
    })

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

    setLoading({
      status: true,
      type: 'audio'
    })

    const response = await fetch(`${apiUrl}/api/audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: lastMessage })
    })

    if (!response.ok) {
      setLoading({
        status: false,
        type: ''
      })
      alert('Error al generar el audio')
      return
    }

    const blob = await response.blob()

    setLoading({
      status: false,
      type: ''
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.style.display = 'none'
    link.setAttribute('download', 'message.mp3')
    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      document.body.removeChild(link)
    }, 25000)
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
          <button
            onClick={translateFile}
            disabled={loading.status}
            className='bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded flex items-center gap-2 disabled:bg-blue-500/50 transition-colors'
          >
            <svg
              aria-hidden='true'
              role='status'
              className={`w-4 h-4 text-white animate-spin ${
                loading.status && loading.type === 'file' ? 'block' : 'hidden'
              }`}
              viewBox='0 0 100 101'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
                fill='#E5E7EB'
              />
              <path
                d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
                fill='currentColor'
              />
            </svg>
            Traducir
          </button>
          <button
            disabled={loading.status}
            onClick={generateAudio}
            className='bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 px-4 py-2 rounded flex items-center gap-2 transition-colors'
          >
            <svg
              aria-hidden='true'
              role='status'
              className={`w-4 h-4 text-white animate-spin ${
                loading.status && loading.type === 'audio' ? 'block' : 'hidden'
              }`}
              viewBox='0 0 100 101'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
                fill='#E5E7EB'
              />
              <path
                d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
                fill='currentColor'
              />
            </svg>
            Generar audio del ultimo mensaje
          </button>
        </div>
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
      <form
        onSubmit={(e) => {
          if (!loading.status) {
            messageInput.current?.blur()
            handleSubmit(e)
          }
        }}
        className='grid grid-cols-[42px_1fr_42px] gap-2'
      >
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
          placeholder='Di algo...'
          ref={messageInput}
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
