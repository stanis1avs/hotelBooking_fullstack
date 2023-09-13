import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { socketConnect, sendDataWS } from '../../reducers/reducersupportChat'
import React, { useState } from 'react'

export default () => {
  const dispatch = useAppDispatch()
  const { socket } = useAppSelector(state => state.reducersupportChat)

  const [activeInput, setActiveInput] = useState(false)
  const [requestText, setRequestText] = useState('')

  const handleCreateRequest = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      dispatch(sendDataWS({ event: 'requestSupport', data: { text: requestText }, socket }))
      setRequestText('')
    }
  }

  const handleRequestSupport = () => {
    dispatch(socketConnect({}))
    setActiveInput(true)
  }

  return (
    <>
      {activeInput
        ? <input type="text" placeholder="Расскажите что случилось" className="self-end" value={requestText}
              onChange={e => { setRequestText(e.target.value) }} onKeyUp={handleCreateRequest}/>
        : <div className="border-2 bg-teal-600 p-3 m-3 rounded-lg h-11 cursor-pointer text-center"
              onClick={handleRequestSupport}>Написать в поддержку</div>
      }
  </>
  )
}
