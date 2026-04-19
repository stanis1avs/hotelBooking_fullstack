import { gql } from 'apollo-angular';

export const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: CreateReservationInput!) {
    createReservation(input: $input) {
      id
      dateStart
      dateEnd
      room {
        description
        images
      }
      hotel {
        title
      }
    }
  }
`;

export const DELETE_RESERVATION = gql`
  mutation DeleteReservation($id: String!) {
    deleteReservation(id: $id)
  }
`;
