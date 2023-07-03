import { NavLink } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { userInfoByTokenRequest } from "../../reducers/reducerauthClient";

export default () => {
  const dispatch = useAppDispatch()
  const { role } = useAppSelector(state => state.reducerauthClient)

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find((cookie) => cookie.trim().startsWith('access_token='));
    const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : null;
    if(accessToken){
      dispatch(userInfoByTokenRequest())
    }
  }, [dispatch]);

  return (
    <nav className="rounded-r-lg w-64 bg-white">
      <ul className="py-5 pl-10 nth-child:pt-3">
        <li className="before:content-['>'] before:mr-1.5 text-gray-700">
          <NavLink to="/allhotels">Все гостиницы</NavLink>
        </li>
        {role === 'client' && <li className="before:content-['>'] before:mr-1.5 text-gray-700">
          <NavLink to="/reservations/myreservations">Мои брони</NavLink>
        </li>}
        {role === 'manager' && <li className="before:content-['>'] before:mr-1.5 text-gray-700">
          <NavLink to="/reservations">Бронирование</NavLink>
        </li>}
        {role === 'admin' && <li className="before:content-['>'] before:mr-1.5 text-gray-700">
          <NavLink to="/allhotels/newhotel">Добавить гостиницу</NavLink>
        </li>}
        {role === 'admin' &&  <li className="before:content-['>'] before:mr-1.5 text-gray-700">
          <NavLink to="/allusers">Пользователи</NavLink>
        </li>}
        <li className="before:content-['>'] before:mr-1.5 text-gray-700">
          <NavLink to="/allhotels/favorites">Избранное</NavLink>
        </li>
      </ul>
    </nav>
  )
}