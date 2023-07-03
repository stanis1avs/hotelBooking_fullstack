import user from "../images/user.png"
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { newClientRequest, loginRequest, logoutRequest } from "../../reducers/reducerauthClient";
import { NewClient } from "../../reducers/typesManageUsers";

export default () => {
  const dispatch = useAppDispatch()
  const { needAuth, id } = useAppSelector(state => state.reducerauthClient)

  const [onOff, setOnOff] = useState(false)
  const [isRegistration, setIsRegistration] = useState(false)

  const initialState = {
    name: '',
    email: '',
    contactPhone: '',
    password: '',
  }

  const [{name, email, contactPhone, password}, setClientInfo] = useState<NewClient>(initialState)

  const handleCreateClient = () => {
    if(name && email && contactPhone && password){
      dispatch(newClientRequest({name, email, contactPhone, password}));
    }
    setClientInfo(initialState)
    setOnOff(false)
    setIsRegistration(false)
  }

  const clicksPopup = () => {
    setOnOff(!onOff)
    setIsRegistration(false)
  }

  const handleLogin = () => {
    if(email && password){
      dispatch(loginRequest({email, password}))
    }
  }

  const handleLogout = () => {
    dispatch(logoutRequest())
    setClientInfo(initialState)
  }

  return (
    <header className="flex justify-end content-center flex-wrap rounded-l-lg h-20 mb-10 ml-11 bg-white cursor-pointer">
      {!id &&
      <>
        <img src={user} alt="user profile" className="mr-8" style={{height: 30, width: 30}} onClick={clicksPopup}/>
        <div className="w-80 bg-neutral-100 absolute top-16 z-10 border-2 rounded-b-lg"
             style={{ display: onOff ? 'block' : 'none'}}>
          {isRegistration &&
          <>
            <input type="text" value={name} placeholder="Введите имя" className="h-6"
                    onChange={(e) => setClientInfo(prevState => ({...prevState, name: e.target.value}))}/>
            <input type="text" value={contactPhone} placeholder="Введите телефон" className="h-6"
                    onChange={(e) => setClientInfo(prevState => ({...prevState, contactPhone: e.target.value}))} />
          </>}
          <input type="text" value={email} placeholder="Введите email" className="h-6"
                    onChange={(e) => setClientInfo(prevState => ({...prevState, email: e.target.value}))}/>
          <input type="password" value={password} placeholder="Введите пароль" className="h-6"
                    onChange={(e) => setClientInfo(prevState => ({...prevState, password: e.target.value}))}/>
          <div className="flex">
            {!isRegistration &&
            <>
              <button className="mt-0 h-6 w-36" onClick={handleLogin}>Войти</button>
              <button className="mt-0 h-6 w-36" onClick={() => setIsRegistration(true)}>Регистрация</button>
            </>}
            {isRegistration && <button className="mt-0 h-6 w-36" onClick={handleCreateClient}>Зарегистрироваться</button>}
          </div>
        </div>
      </>}
      {id && <div className="mr-8" onClick={handleLogout}>Выйти</div>}
      {needAuth && <div className="absolute animation top-24">&#9940; Вам необходимо пройти авторизацию</div>}
    </header>
  )
}