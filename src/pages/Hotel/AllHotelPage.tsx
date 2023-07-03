import { useAppSelector } from '../../store/hooks'
import Layout from "../Layout/Layout"
import HotelItem from "./HotelItem"
import Searching from "./Searching"
import Pagination from "./Pagination"
import { SendHotel } from '../../reducers/typesHotelRoom'

export default () => {
  const { hotels, error } = useAppSelector(state => state.reducerhotelSearch)

  return (
    <Layout>
      <Searching/>
      {!error &&
        hotels.map((el: SendHotel) => {
          return (
            <HotelItem hotel={el} isfavorite={false} key={el.id}/>
          );
        })
      }
      {hotels && <Pagination/>}
      {error && <div>Error: {error}</div>}
    </Layout>
  );
}