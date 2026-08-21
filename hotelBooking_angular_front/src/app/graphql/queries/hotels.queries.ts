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

/**
 * Список для админки — без дат.
 *
 * Отдельно от GET_HOTELS: тому даты обязательны, он отсеивает занятое на период.
 * Управлению отелями нужен весь фонд независимо от брони.
 */
export const ADMIN_HOTELS = gql`
  query AdminHotels($limit: Int, $offset: Int, $search: String) {
    adminHotels(limit: $limit, offset: $offset, search: $search) {
      items {
        ${HOTEL_CARD}
      }
      total
    }
  }
`;
