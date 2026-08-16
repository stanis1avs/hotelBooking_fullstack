import { gql } from 'apollo-angular';

export const MY_RESERVATIONS = gql`
  query MyReservations {
    myReservations {
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

export const ALL_RESERVATIONS = gql`
  query AllReservations($offset: Int, $limit: Int) {
    allReservations(offset: $offset, limit: $limit) {
      items {
        id
        dateStart
        dateEnd
        client {
          id
          name
          contactPhone
        }
        room {
          description
          images
        }
        hotel {
          title
        }
      }
      total
    }
  }
`;
