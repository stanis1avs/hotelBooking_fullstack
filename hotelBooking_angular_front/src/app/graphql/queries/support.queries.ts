import { gql } from 'apollo-angular';

// title теперь скалярная строка: сервер отдавал в этом поле весь документ
// первого сообщения, и клиенту приходилось доставать text вручную.
export const MY_SUPPORT_REQUESTS = gql`
  query MySupportRequests {
    mySupportRequests {
      id
      createdAt
      isActive
      title
    }
  }
`;

export const ALL_SUPPORT_REQUESTS = gql`
  query AllSupportRequests {
    allSupportRequests {
      id
      createdAt
      isActive
      title
    }
  }
`;

export const UNREAD_SUPPORT_COUNT = gql`
  query UnreadSupportCount {
    unreadSupportCount
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
