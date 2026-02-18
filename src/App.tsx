import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AudioUnlockPrompt } from "@/components/ui/AudioUnlockPrompt";
import StartScreen from "@/pages/StartScreen";
import SolarSystemMapWrapper from "@/pages/SolarSystemMapWrapper";
import MissionScreen from "@/pages/MissionScreen";
import BattleScreenWrapper from "@/pages/BattleScreenWrapper";
import ResultScreen from "@/pages/ResultScreen";
import HomeBaseScreen from "@/pages/HomeBaseScreen";
import HomeScreen from "@/pages/HomeScreen";

const App = () => (
  <BrowserRouter>
    {/* Global iOS audio unlock prompt - shows when AudioContext is suspended */}
    <AudioUnlockPrompt />
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<StartScreen />} />
        <Route path="/map" element={<SolarSystemMapWrapper />} />
        <Route path="/mission" element={<MissionScreen />} />
        <Route path="/battle" element={<BattleScreenWrapper />} />
        <Route path="/result" element={<ResultScreen />} />
        <Route path="/homebase" element={<HomeBaseScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
