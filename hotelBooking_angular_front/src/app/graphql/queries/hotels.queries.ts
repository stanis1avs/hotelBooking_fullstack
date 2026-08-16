import { gql } from 'apollo-angular';

const HOTEL_CARD = `
  id
  title
  description
  image
  city
  stars
  rating
  reviewsCount
  amenities
  minPrice
  roomsCount
  freeRooms
`;

export const GET_HOTELS = gql`
  query GetHotels($offset: Int, $limit: Int, $hotel: String, $dateArrival: String!, $dateDeparture: String!) {
    hotels(offset: $offset, limit: $limit, hotel: $hotel, dateArrival: $dateArrival, dateDeparture: $dateDeparture) {
      items {
        ${HOTEL_CARD}
      }
      total
    }
  }
`;

export const GET_HOTEL = gql`
  query GetHotel($id: String!) {
    hotel(id: $id) {
      ${HOTEL_CARD}
    }
  }
`;
