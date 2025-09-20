import React, { useEffect, useState, useRef } from 'react';

const HeroBanner: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setScrollY(containerRef.current.scrollTop);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div ref={containerRef} className="relative w-[48rem] h-[48rem] overflow-auto shadow-2xl">
        <div className="relative h-[200vh] w-full">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/images/back.webp)',
              transform: `translateY(${scrollY * 0.5}px)`,
            }}
          />
          
          <div 
            className="absolute inset-0 w-[48rem] h-[48rem] bg-cover bg-center bg-no-repeat z-10 pointer-events-none"
            style={{
              backgroundImage: 'url(/images/front.webp)',
            }}
          />
          
          <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none" />
          
          <div className="relative z-20 flex items-center justify-center h-full pointer-events-none">
            <div className="text-center text-white px-4">
              <h1 className="text-5xl font-display font-light italic mb-6 tracking-wide drop-shadow-lg">
                Quy Nhơn Gems
              </h1>
              <p className="text-xl font-sans font-extralight italic drop-shadow-md tracking-wide">
                Shhh.. ít người thôi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;