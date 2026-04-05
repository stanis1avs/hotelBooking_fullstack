import Logo from './Logo'
import Navbar from './Navbar'
import Header from './Header'
import chat from '../images/chat.png'
import close from '../images/close.png'
import Aside from './Aside'
import React, { useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { resetChat } from '../../reducers/reducersupportChat'

export default ({ children }: { children: React.ReactNode }) => {
  const [onOff, setOnOff] = useState(false)
  const dispatch = useAppDispatch()
  const { role } = useAppSelector(state => state.reducerauthClient)
  const { socket } = useAppSelector(state => state.reducersupportChat)

  const styles: React.CSSProperties = { width: 30, height: 30, top: '90vh' }

  const closeChat = () => {
    setOnOff(!onOff)
    socket.disconnect()
    dispatch(resetChat())
  }

  const openChat = () => {
    setOnOff(!onOff)
  }

  return (
    <>
      <div className="mt-2.5 flex-col">
        <Logo />
        <Navbar />
      </div>
      <div className="mt-2.5 flex-col">
        <Header />
        {children}
      </div>
      {(role === 'client' || role === 'manager') &&
      <>
        <img src={chat} alt="open chat" className="sticky right-8 cursor-pointer" style={{ ...styles, display: !onOff ? 'block' : 'none' }} onClick={openChat}/>
        <img src={close} alt="close chat" className="sticky right-96 cursor-pointer" style={{ ...styles, display: onOff ? 'block' : 'none' }} onClick={closeChat}/>
        <Aside visibility={onOff}/>
      </>}
    </>
  )
}
