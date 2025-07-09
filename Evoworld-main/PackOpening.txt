import React, { useState, useEffect } from 'react';
import { Package, Trophy, Swords, X } from "lucide-react";
import { Pack, Player } from '../types';
import { getPackProbabilities, players } from '../data/players';

interface PackOpeningProps {
  pack: Pack;
  coins: number;
  onOpen: (cost: number) => void;
}

export function PackOpening({ pack, coins, onOpen }: PackOpeningProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [openedPlayer, setOpenedPlayer] = useState<Player | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [canAfford, setCanAfford] = useState(true);
  const [showBotMatch, setShowBotMatch] = useState(false);
  const [matchResult, setMatchResult] = useState<string | null>(null);
  const [botRating, setBotRating] = useState(0);

  useEffect(() => {
    setCanAfford(coins >= pack.cost);
  }, [coins, pack.cost]);

  const handlePackOpen = async () => {
    if (!canAfford) {
      alert('Not enough coins to open this pack!');
      return;
    }

    setIsOpening(true);
    setShowAnimation(true);

    // Simulate pack opening animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const probabilities = getPackProbabilities(pack.type);
    const rand = Math.random();
    
    let rating;
    if (rand < probabilities[99]) {
      rating = 99;
    } else if (rand < probabilities[99] + probabilities[90]) {
      rating = 90;
    } else if (rand < probabilities[99] + probabilities[90] + probabilities[85]) {
      rating = 85;
    } else {
      rating = 80;
    }

    // Get all players with the selected rating
    const availablePlayers = players.filter(p => p.rating >= rating);
    const player = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    
    setOpenedPlayer(player);
    onOpen(pack.cost);
    
    // Play pack opening sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));

    setTimeout(() => {
      setShowAnimation(false);
      setIsOpening(false);
    }, 500);
  };

  const playAgainstBot = () => {
    if (!openedPlayer) return;

    // Generate bot rating between player's rating - 10 and player's rating + 10
    const randomBotRating = Math.floor(
      Math.random() * 20 + (openedPlayer.rating - 10)
    );
    setBotRating(randomBotRating);

    // Calculate win probability based on rating difference
    const ratingDiff = openedPlayer.rating - randomBotRating;
    const winProbability = 0.5 + (ratingDiff * 0.05); // 5% advantage per rating point
    
    const random = Math.random();
    let result;
    
    if (random < winProbability) {
      result = "Victory! 🏆";
      // Play victory sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } else {
      result = "Defeat 😢";
      // Play defeat sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }

    setMatchResult(result);
    setShowBotMatch(true);
  };

  return (
    <div className="relative">
      <div className={`transition-all duration-500 ${isOpening ? 'scale-110' : ''}`}>
        <button
          onClick={handlePackOpen}
          disabled={!canAfford || isOpening}
          className={`relative w-48 h-64 rounded-xl overflow-hidden transition-all duration-300 ${
            canAfford 
              ? 'hover:transform hover:scale-105 hover:shadow-2xl' 
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {/* Pack Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${
            pack.type === 'high' 
              ? 'from-yellow-400 via-yellow-500 to-yellow-600'
              : pack.type === 'medium'
              ? 'from-gray-300 via-gray-400 to-gray-500'
              : 'from-amber-700 via-amber-800 to-amber-900'
          }`} />

          {/* Pack Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <Package size={32} className="mb-3 text-white" />
            <h3 className="text-lg font-bold text-white mb-2">{pack.label}</h3>
            <div className="flex items-center gap-1">
              <Trophy size={14} className="text-yellow-300" />
              <span className="text-white text-sm">{pack.cost} coins</span>
            </div>
          </div>

          {/* Opening Animation */}
          {showAnimation && (
            <div className="absolute inset-0 bg-white animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
      </div>

      {/* Opened Player Card */}
      {openedPlayer && !showAnimation && !showBotMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-600 to-blue-700 p-8 rounded-2xl max-w-sm w-full mx-4 transform animate-slideUp">
            <div className="relative aspect-square mb-4">
              <img
                src={openedPlayer.image}
                alt={openedPlayer.name}
                className="w-full h-full object-contain rounded-lg"
              />
              <div className="absolute top-2 right-2 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full">
                {openedPlayer.rating}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{openedPlayer.name}</h3>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={openedPlayer.country}
                alt="Country flag"
                className="w-8 h-6 object-cover rounded"
              />
              <span className="text-white">{openedPlayer.position}</span>
              <span className="text-white">{openedPlayer.team}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOpenedPlayer(null)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 rounded-lg transition-colors"
              >
                Continue
              </button>
              <button
                onClick={playAgainstBot}
                className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Swords size={16} />
                Play vs Bot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bot Match Modal */}
      {showBotMatch && openedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-2xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Bot Match</h3>
              <button
                onClick={() => {
                  setShowBotMatch(false);
                  setOpenedPlayer(null);
                  setMatchResult(null);
                }}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex justify-between items-center mb-8">
              <div className="text-center">
                <img
                  src={openedPlayer.image}
                  alt={openedPlayer.name}
                  className="w-24 h-24 object-cover rounded-lg mb-2"
                />
                <p className="text-white font-semibold">{openedPlayer.name}</p>
                <p className="text-yellow-300 font-bold">Rating: {openedPlayer.rating}</p>
              </div>

              <div className="text-white text-4xl font-bold">VS</div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                  <Swords size={48} className="text-gray-500" />
                </div>
                <p className="text-white font-semibold">Bot Player</p>
                <p className="text-yellow-300 font-bold">Rating: {botRating}</p>
              </div>
            </div>

            {matchResult ? (
              <div className="text-center">
                <h4 className="text-3xl font-bold text-white mb-4">{matchResult}</h4>
                <button
                  onClick={() => {
                    setShowBotMatch(false);
                    setOpenedPlayer(null);
                    setMatchResult(null);
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">Simulating match...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
