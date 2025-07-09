import React, { useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { PenaltyGame } from './PenaltyGame';

interface TournamentProps {
  onClose: () => void;
  onReward: (coins: number, credits: number) => void;
}

export function Tournament({ onClose, onReward }: TournamentProps) {
  const [level, setLevel] = useState(1);
  const [showGame, setShowGame] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const calculateRewards = (level: number) => ({
    coins: level * 50,
    credits: level * 20
  });

  const handleScore = () => {
    const rewards = calculateRewards(level);
    onReward(rewards.coins, rewards.credits);
    setLevel(prev => prev + 1);
    setShowGame(false);
  };

  const handleMiss = () => {
    setGameOver(true);
    setShowGame(false);
  };

  const handleReset = () => {
    setLevel(1);
    setShowGame(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg relative max-w-2xl w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Tournament Mode</h2>
          
          {gameOver ? (
            <div className="space-y-4">
              <p className="text-xl">Game Over!</p>
              <p>You reached Level {level}</p>
              <button
                onClick={() => {
                  setLevel(1);
                  setGameOver(false);
                }}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : showGame ? (
            <PenaltyGame
              level={level}
              onScore={handleScore}
              onMiss={handleMiss}
              onClose={() => setShowGame(false)}
              onReset={handleReset}
            />
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Level {level}</h3>
                <p className="text-gray-300 mb-4">
                  Score a goal to advance to the next level!
                </p>
                <div className="text-yellow-400 mb-2">
                  Rewards for this level:
                  <br />
                  {calculateRewards(level).coins} coins
                  <br />
                  {calculateRewards(level).credits} credits
                </div>
                <button
                  onClick={() => setShowGame(true)}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg w-full"
                >
                  Start Level {level}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
