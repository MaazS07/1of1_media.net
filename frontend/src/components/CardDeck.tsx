import React, { useState, useEffect } from 'react';

interface CardFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  gradient: string;
  basePosition: number;
}

interface CardPosition {
  [key: string]: string;
}

const CardDeck: React.FC = () => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [cardsRevealed, setCardsRevealed] = useState<boolean>(false);
  const [currentRotation, setCurrentRotation] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => setCardsRevealed(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setCurrentRotation(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(rotationInterval);
  }, []);

  const cards: CardFeature[] = [
    {
      id: 'ai-agents',
      title: 'AI-Powered',
      subtitle: 'Agents',
      description: 'Create intelligent workflows with pre-built AI agents',
      features: [
        'Pre-built AI Agents',
        'Custom Agent Creation',
        'Agent Orchestration',
        'Intelligent Automation'
      ],
      gradient: 'from-[#1a1a1a] via-[#3827FF] to-[#9F6FFC] hover:from-black hover:via-[#4827FF] hover:to-[#B19EEF]',
      basePosition: 0
    },
    {
      id: 'workflow-builder',
      title: 'Visual Workflow',
      subtitle: 'Builder',
      description: 'Drag-and-drop interface for seamless integration',
      features: [
        'Drag-and-Drop Interface',
        'Visual Flow Design',
        'Real-time Preview',
        'Workflow Templates'
      ],
      gradient: 'from-[#3827FF] via-[#1a1a1a] to-[#9F6FFC] hover:from-[#4827FF] hover:via-black hover:to-[#B19EEF]',
      basePosition: 1
    },
    {
      id: 'multi-input',
      title: 'Multi-Input',
      subtitle: 'Processing',
      description: 'Handle PDFs, images, text, and URLs with ease',
      features: [
        'PDF Processing',
        'Image Analysis',
        'Text Processing',
        'URL Content Extraction'
      ],
      gradient: 'from-[#9F6FFC] via-[#1a1a1a] to-[#3827FF] hover:from-[#B19EEF] hover:via-black hover:to-[#4827FF]',
      basePosition: 2
    },
    {
      id: 'deployment',
      title: 'Seamless',
      subtitle: 'Deployment',
      description: 'Build, deploy, and scale your AI workflows effortlessly',
      features: [
        'One-Click Deploy',
        'Auto-Scaling',
        'Version Control',
        'Performance Monitoring'
      ],
      gradient: 'from-[#1a1a1a] via-[#9F6FFC] to-[#3827FF] hover:from-black hover:via-[#B19EEF] hover:to-[#4827FF]',
      basePosition: 3
    }
  ];

  const positions: string[] = ['front-right', 'front-left', 'back-left', 'back-right'];

  const getCardPosition = (card: CardFeature): string => {
    const positionIndex = (card.basePosition - currentRotation + 4) % 4;
    return positions[positionIndex];
  };

  const getCardStyle = (card: CardFeature): string => {
    const baseStyle = "absolute rounded-3xl shadow-2xl transition-all duration-1000 ease-in-out cursor-pointer hover:shadow-3xl backdrop-blur-sm";
    const position = getCardPosition(card);
    
    const sizeClasses: CardPosition = {
      'front-right': "w-80 h-96",
      'front-left': "w-80 h-96", 
      'back-left': "w-72 h-80",
      'back-right': "w-72 h-80"
    };

    const positionClasses: CardPosition = {
      'front-right': isHovered 
        ? "z-40 transform translate-x-24 -translate-y-8 -rotate-8 scale-100" 
        : "z-40 transform translate-x-16 translate-y-4 -rotate-3 scale-95",
      'front-left': isHovered 
        ? "z-40 transform -translate-x-24 -translate-y-8 rotate-8 scale-100" 
        : "z-40 transform -translate-x-16 translate-y-4 rotate-3 scale-95",
      'back-left': isHovered 
        ? "z-30 transform -translate-x-40 translate-y-2 rotate-12 scale-90" 
        : "z-30 transform -translate-x-28 translate-y-12 rotate-8 scale-85",
      'back-right': isHovered 
        ? "z-30 transform translate-x-40 translate-y-2 -rotate-12 scale-90" 
        : "z-30 transform translate-x-28 translate-y-12 -rotate-8 scale-85"
    };

    const revealClass = cardsRevealed ? 'opacity-100' : 'opacity-0 translate-y-20 scale-80';

    return `${baseStyle} ${sizeClasses[position]} ${positionClasses[position]} ${revealClass}`;
  };

  return (
    <div 
      className="relative w-full h-[32rem] flex justify-center items-start pt-16 perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-black/5 backdrop-blur-sm rounded-3xl" />
      
      {cards.map((card) => (
        <div
          key={card.id}
          className={getCardStyle(card)}
          onClick={() => {}}
        >
          {/* Base gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-3xl opacity-95 transition-all duration-300`} />
          
          {/* Dark overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent rounded-3xl" />
          
          {/* Additional subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-50" />
          
          <div className="relative h-full p-6 text-white flex flex-col">
            <div className="mb-4">
              <div className="font-bold text-2xl mb-1 text-white/95 drop-shadow-lg tracking-wide">{card.title}</div>
              <div className="font-bold text-xl mb-2 text-white/90 drop-shadow-md">{card.subtitle}</div>
              <div className="text-sm font-medium mb-4 text-white/85">{card.description}</div>
              
              <div className="space-y-2">
                {card.features.map((feature, idx) => (
                  <div 
                    key={`${card.id}-feature-${idx}`} 
                    className="flex items-center text-xs text-white/80 hover:text-white/95 transition-colors group"
                  >
                    <div className="w-1.5 h-1.5 bg-white/90 rounded-full mr-2 group-hover:scale-125 transition-transform" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={`rotation-indicator-${index}`}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentRotation === index 
                ? 'bg-[#3827FF] scale-125' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CardDeck;