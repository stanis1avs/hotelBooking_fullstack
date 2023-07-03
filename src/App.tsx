import AllUsersPage from "./pages/Users/AllUsersPage"
import NewHotelPage from "./pages/NewHotel/NewHotelPage"
import AllHotelPage from "./pages/Hotel/AllHotelPage"
import HotelPage from "./pages/Hotel/HotelPage"
import MyReservationPage from "./pages/Reservation/MyReservationPage"
import ReservationPage from "./pages/Reservation/ReservationPage"
import NewReservationPage from "./pages/Reservation/NewReservationPage"
import FavoritesPage from "./pages/Favorite/FavoritesPage"
import {BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <div className="flex">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/allhotels" />}/>
          <Route path="/allhotels" element={<AllHotelPage />}/>
          <Route path="/allhotels/:id" element={<HotelPage />}/>
          <Route path="/allhotels/newhotel" element={<NewHotelPage />}/>
          <Route path="/reservations/myreservations" element={<MyReservationPage />}/>
          <Route path="/reservations" element={<ReservationPage />}/>
          <Route path="/reservations/newreservation" element={<NewReservationPage />}/>
          <Route path="/allusers" element={<AllUsersPage />}/>
          <Route path="/allhotels/favorites" element={<FavoritesPage />}/>
          {/*<Route path="*" element={<ErrorPage />} />*/}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;