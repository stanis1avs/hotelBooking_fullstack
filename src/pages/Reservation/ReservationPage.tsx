import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import Layout from "../Layout/Layout"
import Reservation from "./Reservation"
import Pagination from "./Pagination"
import { reservationPageRequest } from '../../reducers/reducerreservationPage'

export default () => {
  const dispatch = useAppDispatch();
  const { reservations, offset, error } = useAppSelector(state => state.reducerreservationPage)

  useEffect(() => {
    dispatch(reservationPageRequest({offset}))
  }, [offset]);

  return (
    <Layout>
      <main>
        {!error &&
          <table>
          <thead>
            <tr>
              <th>Отеля</th>
              <th>Имя</th>
              <th>Телефон</th>
              <th>Заезд</th>
              <th>Выезд</th>
              <th>Удалить</th>
            </tr>
            </thead>
            <tbody>
            {reservations.map((el: any) => {
              return (
                <Reservation reservation={el} key={el.id}/>
              );
            })}
            </tbody>
          </table>
        }
      </main>
      {reservations && <Pagination/>}
      {error && <div>Error: {error}</div>}
    </Layout>
  );
}