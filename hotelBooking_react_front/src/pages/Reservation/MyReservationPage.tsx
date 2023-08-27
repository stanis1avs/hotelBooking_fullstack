import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { useEffect } from 'react'
import { reservationsUserRequest } from '../../reducers/reducerreservationPage'
import Layout from '../Layout/Layout'
import MyReservation from './MyReservation'

export default () => {
  const dispatch = useAppDispatch()
  const { reservations, error } = useAppSelector(state => state.reducerreservationPage)

  useEffect(() => {
    dispatch(reservationsUserRequest())
  }, [dispatch])

  return (
    <Layout>
      <main>
        <h2 className="text-2xl ml-2.5 py-5">Ваши брони</h2>
        {reservations.length !== 0 && reservations.map((el: any) => {
          return <MyReservation key={el.id} el={el}/>
        })
        }
        {error && <div>Error: {error}</div>}
      </main>
    </Layout>
  )
}
