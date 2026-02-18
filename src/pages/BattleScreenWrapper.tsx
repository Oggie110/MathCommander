import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import BattleScreen from './BattleScreen';
import BattleScreenMobile from './BattleScreenMobile';

const BattleScreenWrapper: React.FC = () => {
    const isMobile = useIsMobile();
    const location = useLocation();

    // Use location key to force a full remount on navigation
    const battleKey = location.key;

    if (isMobile) {
        return <BattleScreenMobile key={battleKey} />;
    }

    return <BattleScreen key={battleKey} />;
};

export default BattleScreenWrapper;
