import { useState } from 'react'
import { useAppDispatch } from '../../store/hooks'
import { newUserRequest } from '../../reducers/reducermanageUsers'
import { type NewUser } from '../../reducers/typesManageUsers'

export default () => {
  const dispatch = useAppDispatch()

  const initialState = {
    name: '',
    email: '',
    contactPhone: '',
    password: '',
    role: ''
  }

  const [{ name, email, contactPhone, password, role }, setUserInfo] = useState<NewUser>(initialState)

  const handleCreateUser = () => {
    if (name && email && contactPhone && password) {
      dispatch(newUserRequest({ name, email, contactPhone, password, role: role || 'client' }))
      setUserInfo(initialState)
    }
  }

  return (
    <div className="mt-5">
      <label>Имя пользователя
      <input type="text" className="w-52 ml-4" value={name} onChange={(e) => { setUserInfo(prevState => ({ ...prevState, name: e.target.value })) }} />
      </label>
      <label>Электронная почта
      <input type="text" className="w-52 ml-6" value={email} onChange={(e) => { setUserInfo(prevState => ({ ...prevState, email: e.target.value })) }} />
      </label>
      <label>Номер телефона
      <input type="text" className="w-52 ml-7" value={contactPhone} onChange={(e) => { setUserInfo(prevState => ({ ...prevState, contactPhone: e.target.value })) }} />
      </label>
      <label>Пароль пользователя
      <input type="password" className="w-52" value={password} onChange={(e) => { setUserInfo(prevState => ({ ...prevState, password: e.target.value })) }} />
      </label>
      <label>Роль пользователя
        <select className="w-52 ml-3" onChange={(e) => { setUserInfo(prevState => ({ ...prevState, role: e.target.value })) }}>
         <option value="client">client</option>
         <option value="manager">manager</option>
         <option value="admin">admin</option>
        </select>
      </label>
      <button style={{ background: '#1AA053' }} onClick={handleCreateUser}>Сохранить</button>
    </div>
  )
}
