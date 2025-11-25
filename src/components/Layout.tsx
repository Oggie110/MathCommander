import React from 'react';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-space-black text-white font-pixel overflow-hidden relative">
            {/* Starfield Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 animate-pulse"></div>
                {Array.from({ length: 50 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            opacity: Math.random(),
                            animation: `twinkle ${Math.random() * 5 + 2}s infinite`
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                <Outlet />
            </div>

            <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
        </div>
    );
};
