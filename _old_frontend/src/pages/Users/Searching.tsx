import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { useState, useEffect } from 'react'
import { usersSearchRequest, setParamsManageUsers } from '../../reducers/reducermanageUsers'

export default () => {
  const dispatch = useAppDispatch()
  const { offset, name, email, contactPhone } = useAppSelector(state => state.reducermanageUsers)

  useEffect(() => {
    dispatch(usersSearchRequest({ offset, name, email, contactPhone }))
  }, [offset, name, email, contactPhone, dispatch])

  const [userInfo, setUserInfo] = useState('')

  const handleClick = () => {
    const userInfoKey = /@[^.]+\./.test(userInfo) ? 'email' : /[+, 7,8]\d/.test(userInfo) ? 'contactPhone' : 'name'
    dispatch(setParamsManageUsers({
      name: '',
      email: '',
      contactPhone: '',
      [userInfoKey]: userInfo
    }))
  }

  return (
    <>
      <h2 className="text-2xl ml-2.5 py-5">Пользователи</h2>
      <input type="text" placeholder="Введите имя пользователя, телефон или почту" onChange={(e) => { setUserInfo(e.target.value) }} />
      <button onClick={handleClick}>Искать</button>
    </>
  )
}
