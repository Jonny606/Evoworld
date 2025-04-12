import React from 'react';
import { X } from 'lucide-react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onClose: () => void;
}

export function PlayerCard({ player, onClose }: PlayerCardProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg relative max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{player.name}</h2>
          <img
            src={player.country}
            alt="Country flag"
            className="w-16 h-auto mx-auto mb-4"
          />
          <img
            src={player.image}
            alt={player.name}
            className="w-48 h-48 object-cover mx-auto rounded-lg mb-4"
          />
          <div className="space-y-2">
            <p>Position: {player.position}</p>
            <p>Team: {player.team}</p>
            <p>Rating: {player.rating}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
