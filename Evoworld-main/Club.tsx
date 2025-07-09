import React from 'react';
import { X, ArrowUp } from 'lucide-react';
import { Player } from '../types';

interface ClubProps {
  players: Player[];
  onClose: () => void;
  credits: number;
  setCredits: (credits: number) => void;
  setPlayers: (players: Player[]) => void;
}

export function Club({ players, onClose, credits, setCredits, setPlayers }: ClubProps) {
  const calculateUpgradeCost = (rating: number) => (rating - 80) * 10;

  const upgradePlayer = (index: number) => {
    const player = players[index];
    const cost = calculateUpgradeCost(player.rating);
    
    if (credits >= cost && player.rating < 104) {
      setCredits(credits - cost);
      const updatedPlayers = [...players];
      updatedPlayers[index] = { ...player, rating: player.rating + 1 };
      setPlayers(updatedPlayers);
    } else {
      alert('Not enough credits or maximum upgrade reached!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-auto">
      <div className="bg-gray-800 p-8 rounded-lg relative max-w-4xl w-full m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Your Club</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg">
              <img
                src={player.image}
                alt={player.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <div className="space-y-2">
                <h3 className="font-semibold">{player.name}</h3>
                <p>Rating: {player.rating}</p>
                <button
                  onClick={() => upgradePlayer(index)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg w-full justify-center"
                >
                  <ArrowUp size={16} />
                  Upgrade ({calculateUpgradeCost(player.rating)} credits)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
