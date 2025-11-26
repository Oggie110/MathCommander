import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import StartScreen from "@/pages/StartScreen";
import SolarSystemMap from "@/pages/SolarSystemMap";
import MissionScreen from "@/pages/MissionScreen";
import BattleScreen from "@/pages/BattleScreen";
import ResultScreen from "@/pages/ResultScreen";
import AudioTestPage from "@/pages/AudioTestPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<StartScreen />} />
        <Route path="/map" element={<SolarSystemMap />} />
        <Route path="/mission" element={<MissionScreen />} />
        <Route path="/battle" element={<BattleScreen />} />
        <Route path="/result" element={<ResultScreen />} />
        <Route path="/audio-test" element={<AudioTestPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
