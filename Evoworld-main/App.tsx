import React, { useState } from 'react';
import { Trophy, Users, Package, Coins, Swords } from 'lucide-react';
import { Tournament } from './components/Tournament';
import { Club } from './components/Club';
import { TransferMarket } from './components/TransferMarket';
import { PackOpening } from './components/PackOpening';
import { PenaltyGame } from './components/PenaltyGame';
import { Player } from './types';
import { players } from './data/players';

export default function App() {
  const [showTournament, setShowTournament] = useState(false);
  const [showClub, setShowClub] = useState(false);
  const [showTransferMarket, setShowTransferMarket] = useState(false);
  const [showBotMatch, setShowBotMatch] = useState(false);
  const [coins, setCoins] = useState(1000);
  const [credits, setCredits] = useState(500);
  const [myPlayers, setMyPlayers] = useState<Player[]>([]);

  const packs = [
    { type: 'low', cost: 100, credits: 0, label: 'Bronze Pack' },
    { type: 'medium', cost: 250, credits: 0, label: 'Silver Pack' },
    { type: 'high', cost: 500, credits: 0, label: 'Gold Pack' }
  ];

  const handlePackOpen = (cost: number) => {
    if (coins >= cost) {
      setCoins(prev => prev - cost);
    }
  };

  const handleTournamentReward = (coinsEarned: number, creditsEarned: number) => {
    setCoins(prev => prev + coinsEarned);
    setCredits(prev => prev + creditsEarned);
  };

  const handlePlayerBuy = (player: Player) => {
    setMyPlayers(prev => [...prev, player]);
  };

  const handleBotMatchScore = () => {
    setCoins(prev => prev + 50); // Reward for winning against bot
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-purple-500" />
              <h1 className="text-2xl font-bold">Ultimate Pack Opening</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span>{coins} coins</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-purple-400" />
                <span>{credits} credits</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <button
            onClick={() => setShowTournament(true)}
            className="bg-purple-600 hover:bg-purple-700 p-6 rounded-lg flex flex-col items-center gap-4"
          >
            <Trophy size={48} />
            <span className="text-lg font-medium">Play Tournament</span>
          </button>
          <button
            onClick={() => setShowClub(true)}
            className="bg-blue-600 hover:bg-blue-700 p-6 rounded-lg flex flex-col items-center gap-4"
          >
            <Users size={48} />
            <span className="text-lg font-medium">My Club</span>
          </button>
          <button
            onClick={() => setShowTransferMarket(true)}
            className="bg-green-600 hover:bg-green-700 p-6 rounded-lg flex flex-col items-center gap-4"
          >
            <Coins size={48} />
            <span className="text-lg font-medium">Transfer Market</span>
          </button>
          <button
            onClick={() => setShowBotMatch(true)}
            className="bg-red-600 hover:bg-red-700 p-6 rounded-lg flex flex-col items-center gap-4"
          >
            <Swords size={48} />
            <span className="text-lg font-medium">Play vs Bot</span>
          </button>
        </div>

        {/* Pack Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Available Packs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {packs.map((pack, index) => (
              <PackOpening
                key={index}
                pack={pack}
                coins={coins}
                onOpen={handlePackOpen}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Modals */}
      {showTournament && (
        <Tournament
          onClose={() => setShowTournament(false)}
          onReward={handleTournamentReward}
        />
      )}
      {showClub && (
        <Club
          players={myPlayers}
          onClose={() => setShowClub(false)}
          credits={credits}
          setCredits={setCredits}
          setPlayers={setMyPlayers}
        />
      )}
      {showTransferMarket && (
        <TransferMarket
          availablePlayers={players.filter(p => !myPlayers.find(mp => mp.name === p.name))}
          coins={coins}
          setCoins={setCoins}
          onPlayerBuy={handlePlayerBuy}
          onClose={() => setShowTransferMarket(false)}
        />
      )}
      {showBotMatch && (
        <PenaltyGame
          level={1}
          onScore={handleBotMatchScore}
          onMiss={() => {}}
          onClose={() => setShowBotMatch(false)}
          onReset={() => {}}
        />
      )}
    </div>
  );
}