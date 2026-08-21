import { gql } from 'apollo-angular';

const ROOM_FIELDS = `
  id
  title
  description
  price
  size
  guests
  bed
  images
  isEnabled
  hotel {
    id
    image
    title
    city
    description
  }
`;

export const GET_HOTEL_ROOMS = gql`
  query GetHotelRooms($hotel: String!, $isEnabled: Boolean) {
    hotelRooms(hotel: $hotel, isEnabled: $isEnabled) {
      ${ROOM_FIELDS}
    }
  }
`;

/** Админский список — вместе с отключёнными номерами, иначе их не вернуть в продажу. */
export const ADMIN_ROOMS = gql`
  query AdminRooms($hotel: String!) {
    adminRooms(hotel: $hotel) {
      ${ROOM_FIELDS}
    }
  }
`;
