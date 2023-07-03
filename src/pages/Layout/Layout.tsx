import Logo from "./Logo"
import Navbar from "./Navbar"
import Header from "./Header"
import chat from "../images/chat.png"
import close from "../images/close.png"
import Aside from "./Aside"
import React, { useState } from 'react'
import { useAppSelector } from '../../store/hooks'

export default ({children}: {children: React.ReactNode}) => {
  const [onOff, setOnOff] = useState(false)
  const { role } = useAppSelector(state => state.reducerauthClient)

  const styles: React.CSSProperties = {width: 30, height: 30, top: "90vh"}

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
      {(role === "client" || role === "manager") &&
      <>
        <img src={chat} alt="open chat" className="sticky right-8 cursor-pointer" style={{...styles, display: !onOff ? 'block' : 'none'}} onClick={() => setOnOff(!onOff)}/>
        <img src={close} alt="close chat" className="sticky right-96 cursor-pointer" style={{...styles, display: onOff ? 'block' : 'none'}} onClick={() => setOnOff(!onOff)}/>
        <Aside visibility={onOff}/>
      </>}
    </>
  );
}