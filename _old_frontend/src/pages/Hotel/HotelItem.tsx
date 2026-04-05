import { useNavigate } from 'react-router-dom'
import inactive from '../images/inactive.png'
import active from '../images/active.png'
import React, { useState, useEffect } from 'react'
import { useAppDispatch } from '../../store/hooks'
import { changeStateWithoutRequest } from '../../reducers/reducerhotelPage'
import { type SendHotel } from '../../reducers/typesHotelRoom'

export default ({ hotel, isfavorite }: { hotel: SendHotel } & { isfavorite: boolean }) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [onOff, setOnOff] = useState(false)

  useEffect(() => {
    isfavorite ? setOnOff(true) : localStorage.getItem(`hotel_${hotel.id}`) ? setOnOff(true) : setOnOff(false)
  }, [])

  const styles: React.CSSProperties = { width: 25, height: 25 }

  const handleClick = () => {
    dispatch(changeStateWithoutRequest({ id: hotel.id }))
    navigate(`/allhotels/${hotel.id}`)
  }

  const handleAddFavorite = () => {
    setOnOff(!onOff)
    if (hotel.id) {
      localStorage.setItem(`hotel_${hotel.id}`, JSON.stringify(hotel))
    }
  }

  const handleRemoveFavorite = () => {
    setOnOff(!onOff)
    if (hotel.id) {
      localStorage.removeItem(`hotel_${hotel.id}`)
    }
  }

  return (
    <section>
      <img src={`data:'image/jpg';base64,${hotel.image}`} className="w-64 h-52 m-5 rounded-lg" alt={hotel.title}/>
      <div className="w-3/6 block ml-8">
        <div className="flex justify-between">
          <h4 className="ml-2.5 my-5 font-bold">{hotel.title}</h4>
          <img src={inactive} alt="favorite" style={{ ...styles, display: !onOff ? 'block' : 'none' }} className="mt-2.5 cursor-pointer" onClick={handleAddFavorite}/>
          <img src={active} alt="favorite" style={{ ...styles, display: onOff ? 'block' : 'none' }} className="mt-2.5 cursor-pointer" onClick={ handleRemoveFavorite}/>
        </div>
        <p className="ml-2.5 text-gray-700 mb-5">{hotel.description}</p>
        <button onClick={handleClick}>Подробнее</button>
      </div>
    </section>
  )
}
