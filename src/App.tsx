import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AudioUnlockPrompt } from "@/components/ui/AudioUnlockPrompt";
import StartScreen from "@/pages/StartScreen";
import SolarSystemMap from "@/pages/SolarSystemMap";
import MissionScreen from "@/pages/MissionScreen";
import BattleScreen from "@/pages/BattleScreen";
import ResultScreen from "@/pages/ResultScreen";
import AudioTestPage from "@/pages/AudioTestPage";
import HomeBaseScreen from "@/pages/HomeBaseScreen";

const App = () => (
  <BrowserRouter>
    {/* Global iOS audio unlock prompt - shows when AudioContext is suspended */}
    <AudioUnlockPrompt />
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<StartScreen />} />
        <Route path="/map" element={<SolarSystemMap />} />
        <Route path="/mission" element={<MissionScreen />} />
        <Route path="/battle" element={<BattleScreen />} />
        <Route path="/result" element={<ResultScreen />} />
        <Route path="/audio-test" element={<AudioTestPage />} />
        <Route path="/homebase" element={<HomeBaseScreen />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
