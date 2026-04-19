import { gql } from 'apollo-angular';

export const GET_HOTELS = gql`
  query GetHotels($offset: Int, $hotel: String, $dateArrival: String!, $dateDeparture: String!) {
    hotels(offset: $offset, hotel: $hotel, dateArrival: $dateArrival, dateDeparture: $dateDeparture) {
      id
      title
      description
      image
    }
  }
`;
