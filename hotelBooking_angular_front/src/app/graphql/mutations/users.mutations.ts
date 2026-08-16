import { gql } from 'apollo-angular';

export const ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($id: String!, $input: UpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      id
      email
      name
      contactPhone
      role
    }
  }
`;

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
