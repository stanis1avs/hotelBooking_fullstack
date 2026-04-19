import { gql } from 'apollo-angular';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      access_token
      refresh_token
      user {
        id
        email
        name
        contactPhone
        role
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      id
      email
      name
      contactPhone
      role
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      access_token
      refresh_token
      user {
        id
        email
        name
        contactPhone
        role
      }
    }
  }
`;
