import { gql } from 'apollo-angular';

export const MY_SUPPORT_REQUESTS = gql`
  query MySupportRequests {
    mySupportRequests {
      id
      createdAt
      isActive
      title {
        text
      }
    }
  }
`;

export const ALL_SUPPORT_REQUESTS = gql`
  query AllSupportRequests {
    allSupportRequests {
      id
      createdAt
      isActive
      title {
        text
      }
    }
  }
`;

export const SUPPORT_MESSAGES = gql`
  query SupportMessages($requestId: String!) {
    supportMessages(requestId: $requestId) {
      id
      text
      createdAt
      readAt
      author
      requestId
    }
  }
`;
