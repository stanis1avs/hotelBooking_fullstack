import { useState } from "react";
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { useNavigate } from "react-router-dom";
import { createReservationRequest } from "../../reducers/reducerreservationPage";

export default () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { roomId, type, title, imagesRooms, error } = useAppSelector(state => state.reducerreservationPage)

  const [dateStart, setdateStart] = useState('')
  const [dateEnd, setdateEnd] = useState('')

  const handlerCreateReservation = () => {
    dispatch(createReservationRequest({roomId, dateStart, dateEnd}))
    navigate('/reservations/myreservations')
  }

  return (
    <>
      <main>
        <div className="flex">
          <img className="w-72 h-52 m-5 rounded-lg" alt={`Спальня в ${type} номере`} src={`data:'image/jpg';base64,${imagesRooms[0]}`}/>
          <img className="w-64 h-52 m-5 rounded-lg" alt={`Санузел в ${type} номере`} src={`data:'image/jpg';base64,${imagesRooms[1]}`}/>
        </div>
        <table id="reservation" className="ml-2.5 mt-5">
          <thead>
          </thead>
          <tbody>
          <tr>
            <th className="text-left">Название отеля</th>
            <td>{title}</td>
          </tr>
          <tr>
            <th className="text-left">Тип номера</th>
            <td>{type}</td>
          </tr>
          <tr>
            <th className="text-left">Дата заезда</th>
            <td><input type="date" className="w-36 ml-0 mb-2.5" onChange={(e) => setdateStart(new Date(e.target.value).toISOString())}/></td>
          </tr>
          <tr>
            <th className="text-left">Дата выезда</th>
            <td><input type="date" className="w-36 ml-0 mb-2.5" onChange={(e) => setdateEnd(new Date(e.target.value).toISOString())}/></td>
          </tr>
          </tbody>
        </table>
        <div className="flex mt-2.5">
          <button style={{background: "#1AA053"}} onClick={handlerCreateReservation}>Создать</button>
        </div>
      </main>
      {error && <div>Error: {error}</div>}
    </>
  );
}