import { useAppSelector } from '../../store/hooks'
import Layout from '../Layout/Layout'
import UserItem from './UserItem'
import Searching from './Searching'
import Pagination from './Pagination'
import NewUser from './NewUser'
import { type SendUser } from '../../reducers/typesManageUsers'

export default () => {
  const { users, error } = useAppSelector(state => state.reducermanageUsers)

  return (
    <Layout>
      <main>
        <Searching/>
        <NewUser/>
        {!error &&
          <table className="ml-2.5 mt-5">
          <thead>
          <tr>
            <th>Id</th>
            <th>Имя</th>
            <th>Телефон</th>
            <th>Email</th>
            <th>Роль</th>
          </tr>
          </thead>
          <tbody>
          {users.map((el: SendUser) => {
            return (
              <UserItem user={el} key={el.id}/>
            )
          })}
          </tbody>
          </table>
        }
      </main>
      {users && <Pagination/>}
      {error && <div>Error: {error}</div>}
    </Layout>
  )
}
