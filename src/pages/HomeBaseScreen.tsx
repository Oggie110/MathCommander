import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const HomeBaseScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
            {/* Back button */}
            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={() => navigate('/map')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded border-2 border-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm">BACK TO MAP</span>
                </button>
            </div>

            {/* Home Base Image - 75% bigger */}
            <div className="w-full" style={{ maxWidth: '1344px' }}>
                <img
                    src="/assets/1NewStuff/homebase.png"
                    alt="Home Base"
                    className="w-full h-auto"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>
        </div>
    );
};

export default HomeBaseScreen;
