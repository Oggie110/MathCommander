import { useIsMobile } from '@/hooks/useIsMobile';
import BattleScreen from './BattleScreen';
import BattleScreenMobile from './BattleScreenMobile';

const BattleScreenWrapper: React.FC = () => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <BattleScreenMobile />;
    }

    return <BattleScreen />;
};

export default BattleScreenWrapper;
