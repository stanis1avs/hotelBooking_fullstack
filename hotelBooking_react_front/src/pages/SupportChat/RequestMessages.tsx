import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { sendDataWS, messageEvent, messagesSearchSuccess } from '../../reducers/reducersupportChat'
import React, { useEffect, useState, useRef } from 'react'
import { type SendMessages } from '../../reducers/typesSupportChat'

export default () => {
  const dispatch = useAppDispatch()
  const { id } = useAppSelector(state => state.reducerauthClient)
  const { messages, socket, id: requestId } = useAppSelector(state => state.reducersupportChat)

  const [messageText, setMessageText] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lastMesgUnread()) {
      dispatch(sendDataWS({ event: 'readMessages', data: { id: requestId }, socket }))
    }
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })

    socket.on('message', (message: SendMessages) => {
      if (message.requestId === requestId) {
        dispatch(messageEvent(message))
      }
    })
    socket.on('messagesRead', (messages: SendMessages[]) => {
      dispatch(messagesSearchSuccess(messages))
    })
  }, [dispatch, messages])

  const lastMesgUnread = () => {
    const reversedMessages = [...messages].reverse()
    const lastUnreadMessage = reversedMessages.find((mesg: SendMessages) => mesg.author !== id && !mesg.readAt)
    if (!lastUnreadMessage) {
      return false
    }
    return true
  }

  const handleSendMessage = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      dispatch(sendDataWS({ event: 'sendMessage', data: { text: messageText, id: requestId }, socket }))
      setMessageText('')
    }
  }

  const isFirstMesg = (mesg: SendMessages) => {
    const indexMesg = messages.indexOf(mesg)
    if (indexMesg !== 0 && new Date(messages[indexMesg - 1].createdAt).getDay() === new Date(mesg.createdAt).getDay()) {
      return false
    }
    return true
  }

  const isAuthor = (idAuthor: string) => {
    if (id !== idAuthor) {
      return false
    }
    return true
  }

  return (
    <>
      <div className="flex flex-col overflow-y-auto">
        {messages.map((message: SendMessages) => (
          <div key={message.id} className="flex flex-col m-px" style={ isAuthor(message.author) ? { background: message.readAt ? 'none' : '#e3e5eb' } : {} }>

            {isFirstMesg(message) && <h6 className="self-center text-xs">{new Date(message.createdAt).toDateString()}</h6>}
            <div className={`message ${isAuthor(message.author) ? 'messageThem' : 'messageMe'}`}>{message.text}</div>

          </div>
        ))}
        <div ref={chatContainerRef}></div>
      </div>

      <input type="text" placeholder="Введите сообщение" className="self-end" value={messageText}
        onChange={e => { setMessageText(e.target.value) }} onKeyUp={handleSendMessage}/>
    </>
  )
}
