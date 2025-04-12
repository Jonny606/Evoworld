import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { Pack } from '../types';
import { players, getPackProbabilities } from '../data/players';

interface PackOpeningProps {
  pack: Pack;
  onOpen: () => void;
}

export function PackOpening({ pack, onOpen }: PackOpeningProps) {
  const [openedPlayer, setOpenedPlayer] = useState(null);

  const getPlayerFromPack = () => {
    const probabilities = getPackProbabilities(pack.type);
    const rand = Math.random();
    
    let playerPool;
    if (rand < probabilities[99]) {
      playerPool = players.filter(p => p.rating === 99);
    } else if (rand < probabilities[99] + probabilities[90]) {
      playerPool = players.filter(p => p.rating >= 90 && p.rating < 99);
    } else if (rand < probabilities[99] + probabilities[90] + probabilities[85]) {
      playerPool = players.filter(p => p.rating >= 85 && p.rating < 90);
    } else {
      playerPool = players.filter(p => p.rating < 85);
    }
    
    return playerPool[Math.floor(Math.random() * playerPool.length)];
  };

  const handlePackOpen = () => {
    const player = getPlayerFromPack();
    setOpenedPlayer(player);  // Set the selected player to state
    onOpen();
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handlePackOpen}
        className="bg-gray-800 p-6 rounded-lg flex flex-col items-center gap-4 hover:bg-gray-700 transition-colors"
      >
        <Package size={48} className="text-purple-500" />
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">{pack.label}</h3>
          <p className="text-gray-400">Cost: {pack.cost} Coins</p>
        </div>
      </button>

      {/* Render the opened player details here */}
      {openedPlayer && (
        <div className="mt-6">
          <h4 className="text-xl font-semibold">You got:</h4>
          <p className="text-lg">{openedPlayer.name} ({openedPlayer.rating} OVR)</p>
          <img src={openedPlayer.imageUrl} alt={openedPlayer.name} className="w-32 h-32 rounded-full mt-2" />
        </div>
      )}
    </div>
  );
}
