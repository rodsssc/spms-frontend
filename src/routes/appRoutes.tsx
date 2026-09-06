import { BrowserRouter,Routes } from "react-router-dom";
import AdviserRoutes from "./adviserRoutes";
import AuthRoutes from "./authRoutes";
import StudentRoutes from "./studentRoutes";

export default function AppRoutes(){
    return(
        <BrowserRouter>
            <Routes>
                {AdviserRoutes()},
                {AuthRoutes()},
                {StudentRoutes()}
            </Routes>
        </BrowserRouter>
    );
}