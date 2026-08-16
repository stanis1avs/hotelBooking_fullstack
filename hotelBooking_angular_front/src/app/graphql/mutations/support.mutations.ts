import { gql } from 'apollo-angular';

export const CLOSE_SUPPORT_REQUEST = gql`
  mutation CloseSupportRequest($id: String!) {
    closeSupportRequest(id: $id)
  }
`;

// Создание обращения и отправка сообщений раньше существовали только
// как события WebSocket, поэтому кнопки в интерфейсе упирались в 404.
export const CREATE_SUPPORT_REQUEST = gql`
  mutation CreateSupportRequest($text: String!) {
    createSupportRequest(text: $text) {
      id
      createdAt
      isActive
      title
    }
  }
`;

// Возвращает новое число непрочитанных — для отметки на пункте меню
export const MARK_SUPPORT_MESSAGES_READ = gql`
  mutation MarkSupportMessagesRead($requestId: String!) {
    markSupportMessagesRead(requestId: $requestId)
  }
`;

export const SEND_SUPPORT_MESSAGE = gql`
  mutation SendSupportMessage($requestId: String!, $text: String!) {
    sendSupportMessage(requestId: $requestId, text: $text) {
      id
      text
      createdAt
      readAt
      author
      requestId
    }
  }
`;
