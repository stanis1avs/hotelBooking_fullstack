import { gql } from 'apollo-angular';

export const ADMIN_USERS = gql`
  query AdminUsers($limit: Int, $offset: Int, $email: String, $name: String, $contactPhone: String) {
    adminUsers(limit: $limit, offset: $offset, email: $email, name: $name, contactPhone: $contactPhone) {
      id
      email
      name
      contactPhone
      role
    }
  }
`;

export const MANAGER_USERS = gql`
  query ManagerUsers($limit: Int, $offset: Int, $email: String, $name: String, $contactPhone: String) {
    managerUsers(limit: $limit, offset: $offset, email: $email, name: $name, contactPhone: $contactPhone) {
      id
      email
      name
      contactPhone
      role
    }
  }
`;
