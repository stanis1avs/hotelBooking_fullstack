import { gql } from 'apollo-angular';

export const GET_HOTEL_ROOMS = gql`
  query GetHotelRooms($hotel: String!, $isEnabled: Boolean) {
    hotelRooms(hotel: $hotel, isEnabled: $isEnabled) {
      id
      description
      images
      isEnabled
      hotel {
        id
        image
        title
        description
      }
    }
  }
`;
