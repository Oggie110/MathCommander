import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import BattleScreen from './BattleScreen';
import BattleScreenMobile from './BattleScreenMobile';

const BattleScreenWrapper: React.FC = () => {
    const isMobile = useIsMobile();
    const location = useLocation();

    // Generate a unique key each time we navigate to battle
    // This forces a full remount to reset all state (dialogue, intro sequence, etc.)
    const [battleKey, setBattleKey] = useState(() => Date.now());

    useEffect(() => {
        // Update key whenever location changes to force remount
        setBattleKey(Date.now());
    }, [location.key]);

    if (isMobile) {
        return <BattleScreenMobile key={battleKey} />;
    }

    return <BattleScreen key={battleKey} />;
};

export default BattleScreenWrapper;
