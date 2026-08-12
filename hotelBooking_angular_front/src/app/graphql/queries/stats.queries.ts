import { gql } from 'apollo-angular';

/** Агрегаты для дашборда менеджера: значение, динамика к прошлому периоду и ряд по дням. */
export const MANAGER_STATS = gql`
  query ManagerStats($days: Int) {
    managerStats(days: $days) {
      days
      revenue { value delta series }
      bookings { value delta series }
      upcoming { value delta series }
      staying { value delta series }
    }
  }
`;
