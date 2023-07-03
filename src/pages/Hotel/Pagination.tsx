import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setParamsHotelSearch } from "../../reducers/reducerhotelSearch";

export default () => {
  const dispatch = useAppDispatch()

  const { offset, hotels } = useAppSelector(state => state.reducerhotelSearch)

  const handleNextPageClick = () => {
    dispatch(setParamsHotelSearch({offset: offset + 10}))
  };

  const handlePrevPageClick = () => {
    dispatch(setParamsHotelSearch({offset: offset - 10}))
  };

  return (
    <div className="ml-11 text-lg">
      <button style={{background: offset < 10 ? "#5D73E1" : "#071976"}} onClick={handlePrevPageClick} disabled={offset < 10 ? true : false}> {'<'} </button>
      <button style={{background: hotels.length === 10 ? "#071976" : "#5D73E1"}} onClick={handleNextPageClick} disabled={hotels.length === 10 ? false : true}> {'>'} </button>
    </div>
  );
}