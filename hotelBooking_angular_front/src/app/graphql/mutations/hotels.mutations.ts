import { gql } from 'apollo-angular';

// Удаление мягкое: отель и его номера уходят из выдачи, история броней остаётся.
export const DELETE_HOTEL = gql`
  mutation DeleteHotel($id: String!) {
    deleteHotel(id: $id)
  }
`;

export const DELETE_ROOM = gql`
  mutation DeleteRoom($id: String!) {
    deleteRoom(id: $id)
  }
`;
