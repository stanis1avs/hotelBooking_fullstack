import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setParamsReservation } from "../../reducers/reducerreservationPage";

export default () => {
  const dispatch = useAppDispatch()

  const { offset, reservations } = useAppSelector(state => state.reducerreservationPage)

  const handleNextPageClick = () => {
    dispatch(setParamsReservation({offset: offset + 50}))
  };

  const handlePrevPageClick = () => {
    dispatch(setParamsReservation({offset: offset - 50}))
  };

  return (
    <div className="ml-11 text-lg">
      <button style={{background: offset < 50 ? "#5D73E1" : "#071976"}} onClick={handlePrevPageClick} disabled={offset < 50 ? true : false}> {'<'} </button>
      <button style={{background: reservations.length === 50 ? "#071976" : "#5D73E1"}} onClick={handleNextPageClick} disabled={reservations.length === 50 ? false : true}> {'>'} </button>
    </div>
  );
}