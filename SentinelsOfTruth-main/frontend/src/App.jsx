import Home_page from "./pages/Home_page";
import { Routes, Route } from "react-router";
import Navbar from "./Navigatiaon/Nav_bar";
import About
 from "./pages/About_page";
function App() {
  return (
   <>
   <Navbar/>
   <Routes>
      <Route path="/" element={<Home_page/>}></Route>
      <Route path="/about" element={<About/>}></Route>
   </Routes>
   </>
  );
}

export default App;
