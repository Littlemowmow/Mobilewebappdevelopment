import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Discover } from "./components/Discover";
import { Trips } from "./components/Trips";
import { TripDetail } from "./components/TripDetail";
import { Profile } from "./components/Profile";
import { NewTrip } from "./components/NewTrip";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Discover },
      { path: "trips", Component: Trips },
      { path: "trips/new", Component: NewTrip },
      { path: "trips/:tripId", Component: TripDetail },
      { path: "profile", Component: Profile },
    ],
  },
]);