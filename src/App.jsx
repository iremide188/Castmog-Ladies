import { Routes, Route } from "react-router-dom";
import { Navbar, Footer } from "./components/ui";
import Home from "./pages/Home";
import About from "./pages/About";
import Training from "./pages/Training";
import Coaches from "./pages/Coaches";
import Gallery from "./pages/Gallery";
import News from "./pages/News";
import Apply from "./pages/Apply";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/training" element={<Training />} />
          <Route path="/coaches" element={<Coaches />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/news" element={<News />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
