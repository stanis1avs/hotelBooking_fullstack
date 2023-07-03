import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  clientRequestsRequest, managerRequestsRequest, getHistoryRequest,
  socketConnect, sendDataWS,
  messageEvent, requestEvent } from "../../reducers/reducersupportChat";
import React, { useEffect, useState } from 'react'
import { SendMessages, SendRequests } from "../../reducers/typesSupportChat";

export default ({visibility}: {visibility: boolean}) => {
  const dispatch = useAppDispatch()
  const { role, id } = useAppSelector(state => state.reducerauthClient)
  const { requests, messages, socket, id: requestId, error } = useAppSelector(state => state.reducersupportChat)

  const [onOff, setOnOff] = useState(false)
  const [requestText, setRequestText] = useState('')
  const [messageText, setMessageText] = useState('')

  useEffect(() => {
    if(role === 'manager'){
      dispatch(managerRequestsRequest())
    } else {
      dispatch(clientRequestsRequest())
    }

  }, [dispatch, role]);

  useEffect(() => {
    if(socket){
      socket.on('connect', () => {

        socket.on('message', (message: SendMessages) => {
          dispatch(messageEvent(message))
        })

        socket.on('createRequest', (request: SendRequests) => {
          dispatch(requestEvent(request))
        })
      })
    }

  }, [dispatch, socket]);



  const handleOpenRequest = (id: string) => {
    setOnOff(true)
    dispatch(getHistoryRequest({id, requests: []}))
    dispatch(socketConnect({id}))
  }

  const handleCreateRequest = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if(event.key === 'Enter'){
      dispatch(sendDataWS({event: 'requestSupport', data: {text: requestText}, socket}))
      setRequestText('');
    }
  }

  const handleSendMessage = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if(event.key === 'Enter'){
      dispatch(sendDataWS({event: 'sendMessage', data: {text: messageText, id: requestId}, socket}))
      setMessageText('');
    }
  }

  const handleRequestSupprt = () => {
    dispatch(socketConnect({}))
    setOnOff(true)
  }

  return (
    <aside className='fixed justify-between flex-col right-0 bg-white' style={{display: visibility ? 'flex' : 'none', top: "40vh"}}>
      <div className="bg-teal-600 h-10 rounded-b-lg text-center pt-4 self-start w-full">Техподдержка</div>
      {requests.length !== 0 && !error && <div className="flex flex-col overflow-y-scroll">
      {requests.map((el: SendRequests) => {
          return (
        <div key={el.id} className="border-teal-600 hover:bg-teal-600 border-2 p-3 m-3 rounded-lg h-11 cursor-pointer"
        onClick={() => handleOpenRequest(el.id)}>{el.title.text}</div>)
      })}
      </div>}
      {messages.length !== 0 && !error && <div className="flex flex-col overflow-y-scroll">
      {messages.map((el: SendMessages) => {
        return (
          <div key={el.id} className="flex flex-col m-px" style={{background: el.readAt ? '#e3e5eb' : undefined}}>
          {id === el.author && <div className="message messageThem">{el.text}</div>}
          {id !== el.author && <div className="message messageMe">{el.text}</div>}
          </div>
        )
      })}
      </div>}
      {!onOff && <div className="border-2 bg-teal-600 p-3 m-3 rounded-lg h-11 cursor-pointer text-center"
       onClick={handleRequestSupprt}>Написать в поддержку</div>}
      {onOff && messages.length === 0 && <input type="text" placeholder="Расскажите что случилось" className="self-end" value={requestText} onChange={e => setRequestText(e.target.value)} onKeyUp={handleCreateRequest}/>}
      {onOff && messages.length !== 0 && <input type="text" placeholder="Введите сообщение" className="self-end" value={messageText} onChange={e =>  setMessageText(e.target.value)} onKeyUp={handleSendMessage}/>}
  </aside>
  )
}


// <h6 className="self-center">Сегодня</h6>
