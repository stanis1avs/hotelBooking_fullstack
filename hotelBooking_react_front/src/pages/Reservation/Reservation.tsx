import { type SendReservationForManagers } from '../../reducers/typesReservationPage'
import { deleteReservationByManagerRequest } from '../../reducers/reducerreservationPage'
import { useAppDispatch } from '../../store/hooks'

export default ({ reservation }: { reservation: SendReservationForManagers }) => {
  const dispatch = useAppDispatch()

  const handleRemoveReservation = () => {
    dispatch(deleteReservationByManagerRequest({ id: reservation.id }))
  }

  return (
    <tr>
      <td className="w-56">{reservation.hotel.title}</td>
      <td>{reservation.client.name}</td>
      <td>{reservation.client.contactPhone}</td>
      <td>{new Date(reservation.dateStart).toLocaleString()}</td>
      <td>{new Date(reservation.dateEnd).toLocaleString()}</td>
      <td><button style={{ background: '#E15D5D' }} onClick={handleRemoveReservation}>Удалить</button></td>
    </tr>
  )
}
