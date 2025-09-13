import { Routes, Route } from "react-router-dom";
import EnhancedHome from "./pages/enhanced-home";
import NotFound from "./pages/not-found";

function App() {
  return (
    <Routes>
      <Route path="/" element={<EnhancedHome />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

