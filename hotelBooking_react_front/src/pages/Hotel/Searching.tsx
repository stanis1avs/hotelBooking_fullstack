import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { useState, useEffect } from 'react'
import { hotelSearchRequest, setParamsHotelSearch } from '../../reducers/reducerhotelSearch'

export default () => {
  const dispatch = useAppDispatch()
  const { offset, hotel, dateArrival, dateDeparture } = useAppSelector(state => state.reducerhotelSearch)

  useEffect(() => {
    dispatch(hotelSearchRequest({ offset, hotel, dateArrival, dateDeparture }))
  }, [hotel, offset, dateArrival, dateDeparture, dispatch])

  const [nameHotel, setNameHotel] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')

  const handleClick = () => {
    dispatch(setParamsHotelSearch({ hotel: nameHotel, dateArrival: arrival, dateDeparture: departure }))
  }

  return (
    <main>
      <h2 className="text-2xl ml-2.5 py-5">Поиск гостиницы</h2>
      <input type="text" placeholder="Введите название гостиницы" onChange={(e) => { setNameHotel(e.target.value) }} />
      <div className="flex">
        <input type="date" onChange={(e) => { setArrival(new Date(e.target.value).toISOString()) }}/>
        <input type="date" onChange={(e) => { setDeparture(new Date(e.target.value).toISOString()) }}/>
      </div>
      <button onClick={handleClick}>Искать</button>
    </main>
  )
}
