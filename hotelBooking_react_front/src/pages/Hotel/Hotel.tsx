import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { hotelPageRequest, deletehotelRequest, deleteroomRequest, changeStateWithoutRequest } from '../../reducers/reducerhotelPage'
import { setParamsReservation } from '../../reducers/reducerreservationPage'

export default () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { rooms, error } = useAppSelector(state => state.reducerhotelPage)
  const { role } = useAppSelector(state => state.reducerauthClient)
  const { id } = useParams()

  useEffect(() => {
    if (id) {
      dispatch(hotelPageRequest({ id }))
    }
  }, [id])

  const handlerEditHotel = () => {
    dispatch(changeStateWithoutRequest({
      nameHotel: rooms[0].hotel.title,
      descriptionHotel: rooms[0].hotel.description,
      imageHotel: rooms[0].hotel.image,
      descriptionRooms: [rooms[0].description, rooms[1].description],
      imagesRooms: {
        standart: [rooms[0].images[0], rooms[0].images[1]],
        lux: [rooms[1].images[0], rooms[1].images[1]]
      },
      roomsId: [rooms[0].id, rooms[1].id]
    }))
    navigate('/allhotels/newhotel')
  }

  const handlerRemoveHotel = () => {
    if (id) {
      dispatch(deletehotelRequest({ id }))
      handlerRemoveRoom('standart')
      handlerRemoveRoom('lux')
      navigate('/allhotels')
    }
  }

  const handlerRemoveRoom = (type: string) => {
    dispatch(deleteroomRequest({ roomId: type === 'standart' ? rooms[0].id : rooms[1].id }))
  }

  const handlerCreateReservation = (type: string) => {
    dispatch(setParamsReservation({
      roomId: type === 'standart' ? rooms[0].id : rooms[1].id,
      imagesRooms: type === 'standart' ? [rooms[0].images[0], rooms[0].images[1]] : [rooms[1].images[0], rooms[1].images[1]],
      title: rooms[0].hotel.title,
      type
    }))
    navigate('/reservations/newreservation')
  }

  return (
    <>
    {rooms.length === 2 && <>
     <section className="flex-col" key={rooms[0].id}>
        <img src={`data:'image/jpg';base64,${rooms[0].hotel.image}`} className="h-96 m-5 rounded-lg" alt={rooms[0].hotel.title}/>
        <h3 className="ml-2.5 my-5 font-bold">{rooms[0].hotel.title}</h3>
        <p className="ml-2.5 text-gray-700 mb-5">{rooms[0].hotel.description}</p>
        {role === 'admin' && <div className="flex">
          <button onClick={handlerEditHotel}>Редактировать</button>
          <button style={{ background: '#E15D5D' }} onClick={handlerRemoveHotel}>Удалить</button>
        </div>}
      </section>
      <section className="flex-col">
        <div className="flex">
          <img src={`data:'image/jpg';base64,${rooms[0].images[0]}`} className="w-72 h-52 m-5 rounded-lg" alt={'Спальня в стандартном номере'}/>
          <img src={`data:'image/jpg';base64,${rooms[0].images[1]}`} className="w-64 h-52 m-5 rounded-lg" alt={'Санузел в стандартном номере'}/>
        </div>
        <h3 className="ml-2.5 my-5 font-bold">Стандартный номер</h3>
        <p className="ml-2.5 text-gray-700 mb-5">{rooms[0].description}</p>
        {role && <div className="flex">
          <button onClick={() => { handlerCreateReservation('standart') }}>Забронировать</button>
        </div>}
      </section>

      <section className="flex-col" key={rooms[1].id}>
        <div className="flex">
          <img src={`data:'image/jpg';base64,${rooms[1].images[0]}`} className="w-72 h-52 m-5 rounded-lg" alt={'Спальня в люксе'}/>
          <img src={`data:'image/jpg';base64,${rooms[1].images[1]}`} className="w-64 h-52 m-5 rounded-lg" alt={'Санузел в люксе'}/>
        </div>
        <h3 className="ml-2.5 my-5 font-bold">Люкс</h3>
        <p className="ml-2.5 text-gray-700 mb-5">{rooms[1].description}</p>
        {role && <div className="flex">
          <button onClick={() => { handlerCreateReservation('lux') }}>Забронировать</button>
        </div>}
      </section>
    </>}
    {error && <div>Error: {error}</div>}
    </>
  )
}
