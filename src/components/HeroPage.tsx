import React from 'react';
import HeroBanner from './HeroBanner';
import { ManualHeroBanner } from './ManualHeroBanner';

const HeroPage: React.FC = () => {
  return (
    <div
     className="min-h-screen"
     style={{
        
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
     }}
    >
      <div
        style={{
          overflowY: 'hidden',
          position: 'relative',
          backgroundColor: '#3F5655'
        }}
      >

      <ManualHeroBanner />
      </div>
    </div>
  );
};

export default HeroPage;