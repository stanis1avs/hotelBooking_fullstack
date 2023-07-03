// import { NavLink } from "react-router-dom";
import { SendUser } from '../../reducers/typesManageUsers'

export default ({user}: {user: SendUser}) => {
  return (
    <tr>
      <td>{user.id}</td>
      <td className="pt-2">{user.name}</td>
      <td>{user.contactPhone}</td>
      <td>{user.email}</td>
      <td>{user.role}</td>
    </tr>
  )
}

// <td><NavLink to={`/allusers/${user.id}`} className="pt-2">{user.name}</NavLink></td>