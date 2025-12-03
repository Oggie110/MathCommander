import { useIsMobile } from '@/hooks/useIsMobile';
import SolarSystemMap from './SolarSystemMap';
import SolarSystemMapMobile from './SolarSystemMapMobile';

const SolarSystemMapWrapper: React.FC = () => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <SolarSystemMapMobile />;
    }

    return <SolarSystemMap />;
};

export default SolarSystemMapWrapper;
