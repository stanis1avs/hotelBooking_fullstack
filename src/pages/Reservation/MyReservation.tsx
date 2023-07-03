import { useAppDispatch } from '../../store/hooks'
import { SendReservationForClients } from '../../reducers/typesReservationPage'
import { deleteReservationByClientRequest } from "../../reducers/reducerreservationPage";

export default ({el}: {el: SendReservationForClients}) => {
  const dispatch = useAppDispatch();

  const handleRemoveReservation = () => {
    dispatch(deleteReservationByClientRequest({id: el.id}))
  }
  return (
      <>
        <div className="flex">
          <img className="w-72 h-52 m-5 rounded-lg" alt={"Спальня в стандартном номере"} src={`data:'image/jpg';base64,${el.room.images[0]}`}/>
          <img className="w-64 h-52 m-5 rounded-lg" alt={"Санузел в стандартном номере"} src={`data:'image/jpg';base64,${el.room.images[1]}`}/>
        </div>
        <table className="ml-2.5 mt-5" id="reservation">
          <thead>
          </thead>
          <tbody>
          <tr>
            <th className="text-left">Название отеля</th>
            <td>{el.hotel.title}</td>
          </tr>
          <tr>
            <th className="text-left">Описание номера</th>
            <td>{el.room.description}</td>
          </tr>
          <tr>
            <th className="text-left">Дата заезда</th>
            <td>{new Date(el.dateStart).toLocaleString()}</td>
          </tr>
          <tr>
            <th className="text-left">Дата выезда</th>
            <td>{new Date(el.dateEnd).toLocaleString()}</td>
          </tr>
          </tbody>
        </table>
        <div className="flex">
          <button style={{background: "#E15D5D", marginTop: "10px"}} onClick={handleRemoveReservation}>Удалить</button>
        </div>
      </>
  );
}