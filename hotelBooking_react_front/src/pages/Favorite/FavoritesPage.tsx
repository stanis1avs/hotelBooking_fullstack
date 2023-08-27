import Layout from '../Layout/Layout'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { useEffect } from 'react'
import Pagination from '../Hotel/Pagination'
import HotelItem from '../Hotel/HotelItem'
import { type SendHotel } from '../../reducers/typesHotelRoom'
import { hotelSearchSuccess } from '../../reducers/reducerhotelSearch'

export default () => {
  const dispatch = useAppDispatch()
  const { hotels } = useAppSelector(state => state.reducerhotelSearch)

  useEffect(() => {
    const hotelsFromFavorites = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('hotel_')) {
        const hotelJson = localStorage.getItem(key)
        if (hotelJson) {
          hotelsFromFavorites.push(JSON.parse(hotelJson))
        }
      }
    }
    dispatch(hotelSearchSuccess(hotelsFromFavorites))
  }, [dispatch])

  return (
    <Layout>
      {hotels.length !== 0 &&
        hotels.map((el: SendHotel) => {
          return (
            <HotelItem hotel={el} isfavorite={true} key={el.id}/>
          )
        })
      }
      {hotels && <Pagination/>}
      {hotels.length === 0 && <div>Вы нничего пока не добавили в избранное</div>}
    </Layout>
  )
}
