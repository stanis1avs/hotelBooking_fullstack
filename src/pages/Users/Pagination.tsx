import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setParamsManageUsers } from "../../reducers/reducermanageUsers";

export default () => {
  const dispatch = useAppDispatch()

  const { offset, users } = useAppSelector(state => state.reducermanageUsers)

  const handleNextPageClick = () => {
    dispatch(setParamsManageUsers({offset: offset + 50}))
  };

  const handlePrevPageClick = () => {
    dispatch(setParamsManageUsers({offset: offset - 50}))
  };

  return (
    <div className="ml-11 text-lg">
      <button style={{background: offset < 50 ? "#5D73E1" : "#071976"}} onClick={handlePrevPageClick} disabled={offset < 50 ? true : false}> {'<'} </button>
      <button style={{background: users.length === 50 ? "#071976" : "#5D73E1"}} onClick={handleNextPageClick} disabled={users.length === 50 ? false : true}> {'>'} </button>
    </div>
  );
}