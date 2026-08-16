import { gql } from 'apollo-angular';

const USER_FIELDS = `
  id
  email
  name
  contactPhone
  role
`;

export const ADMIN_USERS = gql`
  query AdminUsers($limit: Int, $offset: Int, $email: String, $name: String, $contactPhone: String, $role: String) {
    adminUsers(limit: $limit, offset: $offset, email: $email, name: $name, contactPhone: $contactPhone, role: $role) {
      items {
        ${USER_FIELDS}
      }
      total
    }
  }
`;

export const MANAGER_USERS = gql`
  query ManagerUsers($limit: Int, $offset: Int, $email: String, $name: String, $contactPhone: String) {
    managerUsers(limit: $limit, offset: $offset, email: $email, name: $name, contactPhone: $contactPhone) {
      items {
        ${USER_FIELDS}
      }
      total
    }
  }
`;
