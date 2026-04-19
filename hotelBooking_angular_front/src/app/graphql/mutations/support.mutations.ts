import { gql } from 'apollo-angular';

export const CLOSE_SUPPORT_REQUEST = gql`
  mutation CloseSupportRequest($id: String!) {
    closeSupportRequest(id: $id)
  }
`;
