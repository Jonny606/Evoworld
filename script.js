// Game State
let gameState = {
    coins: 1000,
    credits: 500,
    players: [],
    power: 0,
    isPoweringUp: false,
    tournamentLevel: 1
};

import { players } from './players';

// Pack Probabilities
const packProbabilities = {
    bronze: {
        99: 0.001,   // 0.1% chance for 99 OVR
        90: 0.019,   // 1.9% chance for 90+ OVR
        85: 0.18,    // 18% chance for 85-89 OVR
        80: 0.8      // 80% chance for 80-84 OVR
    },
    silver: {
        99: 0.001,   // 0.1% chance for 99 OVR
        90: 0.049,   // 4.9% chance for 90+ OVR
        85: 0.25,    // 25% chance for 85-89 OVR
        80: 0.7      // 70% chance for 80-84 OVR
    },
    gold: {
        99: 0.001,   // 0.1% chance for 99 OVR
        90: 0.099,   // 9.9% chance for 90+ OVR
        85: 0.3,     // 30% chance for 85-89 OVR
        80: 0.6      // 60% chance for 80-84 OVR
    }
};

// UI Functions
function showTournament() {
    const modal = document.getElementById('tournamentModal');
    const tournamentInfo = document.getElementById('tournamentInfo');
    
    const rewards = calculateTournamentRewards(gameState.tournamentLevel);
    
    tournamentInfo.innerHTML = `
        <div class="tournament-level">
            <h3>Level ${gameState.tournamentLevel}</h3>
            <p>Rewards:</p>
            <p>${rewards.coins} coins</p>
            <p>${rewards.credits} credits</p>
            <button onclick="startTournamentMatch()" class="btn tournament">
                Start Match
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}

function showClub() {
    const modal = document.getElementById('clubModal');
    const clubPlayers = document.getElementById('clubPlayers');
    
    clubPlayers.innerHTML = gameState.players.map((player, index) => `
        <div class="player-card">
            <img src="${player.image}" alt="${player.name}">
            <h3>${player.name}</h3>
            <p>Rating: ${player.rating}</p>
            <p>Position: ${player.position}</p>
            <button onclick="upgradePlayer(${index})" class="btn">
                Upgrade (${calculateUpgradeCost(player.rating)} credits)
            </button>
        </div>
    `).join('');
    
    modal.style.display = 'block';
}

function showTransferMarket() {
    const modal = document.getElementById('transferModal');
    const transferPlayers = document.getElementById('transferPlayers');
    
    const availablePlayers = players.filter(p => 
        !gameState.players.find(myP => myP.name === p.name)
    );
    
    transferPlayers.innerHTML = availablePlayers.map(player => `
        <div class="player-card">
            <img src="${player.image}" alt="${player.name}">
            <h3>${player.name}</h3>
            <p>Rating: ${player.rating}</p>
            <p>Position: ${player.position}</p>
            <button onclick="buyPlayer('${player.name}')" class="btn">
                Buy (${calculatePlayerPrice(player.rating)} coins)
            </button>
        </div>
    `).join('');
    
    modal.style.display = 'block';
}

function showBotMatch() {
    document.getElementById('botMatchModal').style.display = 'block';
    resetBotMatch();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Game Logic Functions
function calculateTournamentRewards(level) {
    return {
        coins: level * 50,
        credits: level * 20
    };
}

function calculateUpgradeCost(rating) {
    return (rating - 80) * 10;
}

function calculatePlayerPrice(rating) {
    if (rating >= 99) return 1000;
    if (rating >= 90) return 500;
    if (rating >= 85) return 250;
    return 100;
}

function upgradePlayer(index) {
    const player = gameState.players[index];
    const cost = calculateUpgradeCost(player.rating);
    
    if (gameState.credits >= cost && player.rating < 99) {
        gameState.credits -= cost;
        gameState.players[index] = {
            ...player,
            rating: player.rating + 1
        };
        updateCurrency();
        showClub(); // Refresh the club view
    } else {
        alert(player.rating >= 99 ? 'Maximum rating reached!' : 'Not enough credits!');
    }
}

function buyPlayer(playerName) {
    const player = players.find(p => p.name === playerName);
    const price = calculatePlayerPrice(player.rating);
    
    if (gameState.coins >= price) {
        gameState.coins -= price;
        gameState.players.push(player);
        updateCurrency();
        showTransferMarket(); // Refresh the transfer market
    } else {
        alert('Not enough coins!');
    }
}

function startTournamentMatch() {
    showBotMatch();
    closeModal('tournamentModal');
}
// Pack Opening
function openPack(type) {
    const packCosts = {
        bronze: 100,
        silver: 250,
        gold: 500
    };

    if (gameState.coins < packCosts[type]) {
        alert("Not enough coins!");
        return;
    }

    gameState.coins -= packCosts[type];
    updateCurrency();

    const rand = Math.random();
    const probs = packProbabilities[type];
    let rating;

    // Use cumulative probabilities to determine the rating
    if (rand < probs[99]) {
        rating = 99;
    } else if (rand < probs[99] + probs[90]) {
        rating = 90;
    } else if (rand < probs[99] + probs[90] + probs[85]) {
        rating = 85;
    } else {
        rating = 80;
    }

    const availablePlayers = players.filter(p => p.rating === rating); // Ensure exact match for rating
    const player = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

    showPlayer(player);
    playPackOpenSound();
}
function showPlayer(player) {
    const modal = document.getElementById('playerModal');
    const playerInfo = document.getElementById('playerInfo');
    
    playerInfo.innerHTML = `
        <div class="player-card">
            <img src="${player.image}" alt="${player.name}">
            <h3>${player.name}</h3>
            <p>Rating: ${player.rating}</p>
            <p>Position: ${player.position}</p>
            <p>Team: ${player.team}</p>
            <div class="button-group">
                <button onclick="addToClub(${JSON.stringify(player).replace(/"/g, '&quot;')})" class="btn">
                    Add to Club
                </button>
                <button onclick="playVsBot(${JSON.stringify(player).replace(/"/g, '&quot;')})" class="btn">
                    Play vs Bot
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function addToClub(player) {
    gameState.players.push(player);
    closeModal('playerModal');
    showClub();
}

// Bot Match
function resetBotMatch() {
    gameState.power = 0;
    gameState.isPoweringUp = false;
    document.getElementById('powerBar').style.width = '0%';
    document.getElementById('ball').style.transform = 'translateX(-50%)';
}

function shoot() {
    if (gameState.isPoweringUp) {
        gameState.isPoweringUp = false;
        const success = Math.random() < (gameState.power >= 30 && gameState.power <= 70 ? 0.8 : 0.3);
        
        if (success) {
            const rewards = calculateTournamentRewards(gameState.tournamentLevel);
            gameState.coins += rewards.coins;
            gameState.credits += rewards.credits;
            gameState.tournamentLevel++;
            updateCurrency();
            playGoalSound();
            alert(`Goal! You earned ${rewards.coins} coins and ${rewards.credits} credits!`);
        } else {
            playMissSound();
            alert('Miss!');
        }
        
        setTimeout(() => {
            closeModal('botMatchModal');
            if (success) showTournament();
        }, 1500);
    } else {
        gameState.isPoweringUp = true;
        powerUp();
    }
}

function powerUp() {
    if (!gameState.isPoweringUp) return;
    
    if (gameState.power < 100) {
        gameState.power += 2;
        document.getElementById('powerBar').style.width = gameState.power + '%';
        requestAnimationFrame(powerUp);
    } else {
        gameState.isPoweringUp = false;
    }
}

// Currency
function updateCurrency() {
    document.getElementById('coinCount').textContent = gameState.coins;
    document.getElementById('creditCount').textContent = gameState.credits;
}

// Sound Effects
function playPackOpenSound() {
    playSound('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
}

function playGoalSound() {
    playSound('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
}

function playMissSound() {
    playSound('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
}

function playSound(url) {
    const audio = new Audio(url);
    audio.play().catch(console.error);
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    updateCurrency();
});
