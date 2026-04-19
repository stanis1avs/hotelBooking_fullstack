import { gql } from 'apollo-angular';

export const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser($input: CreateUserInput!) {
    adminCreateUser(input: $input) {
      id
      email
      name
      contactPhone
      role
    }
  }
`;
