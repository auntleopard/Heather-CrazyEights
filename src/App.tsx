/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Suit, Rank, CardData, GameStatus, GameState } from './types';
import { Heart, Diamond, Club, Spade, RotateCcw, Play, Info, X } from 'lucide-react';

// --- Constants ---
const SUITS = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
const RANKS = [
  Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
  Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING
];

// --- Utils ---
const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ id: `${rank}-${suit}`, suit, rank });
    });
  });
  return deck;
};

const shuffle = (deck: CardData[]): CardData[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// --- Components ---

const SuitIcon = ({ suit, className }: { suit: Suit; className?: string }) => {
  switch (suit) {
    case Suit.HEARTS: return <Heart className={`fill-red-500 text-red-500 ${className}`} />;
    case Suit.DIAMONDS: return <Diamond className={`fill-red-500 text-red-500 ${className}`} />;
    case Suit.CLUBS: return <Club className={`fill-black text-black ${className}`} />;
    case Suit.SPADES: return <Spade className={`fill-black text-black ${className}`} />;
  }
};

interface CardProps {
  card: CardData;
  isFaceUp: boolean;
  onClick?: () => void;
  isSelectable?: boolean;
  isHighlighted?: boolean;
}

const Card: React.FC<CardProps> = ({ card, isFaceUp, onClick, isSelectable, isHighlighted }) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={isSelectable ? { y: -20, scale: 1.05 } : {}}
      onClick={onClick}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300
        ${isFaceUp ? 'bg-white' : 'bg-[#FF4500] border-4 border-white'}
        ${isSelectable ? 'hover:shadow-2xl ring-offset-2 ring-offset-orange-500' : ''}
        ${isHighlighted ? 'ring-4 ring-yellow-400 scale-105' : 'shadow-lg'}
      `}
    >
      {isFaceUp ? (
        <div className="w-full h-full p-2 flex flex-col justify-between items-center">
          <div className="self-start flex flex-col items-center">
            <span className={`text-lg font-bold leading-none ${[Suit.HEARTS, Suit.DIAMONDS].includes(card.suit) ? 'text-red-500' : 'text-black'}`}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} className="w-3 h-3" />
          </div>
          <div className="flex-1 flex items-center justify-center">
             <SuitIcon suit={card.suit} className="w-10 h-10 sm:w-12 sm:h-12 opacity-80" />
          </div>
          <div className="self-end flex flex-col items-center rotate-180">
            <span className={`text-lg font-bold leading-none ${[Suit.HEARTS, Suit.DIAMONDS].includes(card.suit) ? 'text-red-500' : 'text-black'}`}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} className="w-3 h-3" />
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div className="w-full h-full border-2 border-white/30 rounded-lg flex items-center justify-center overflow-hidden">
             {/* Orange Pattern */}
             <div className="grid grid-cols-3 gap-1 opacity-40">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-white rounded-full" />
                ))}
             </div>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-display text-4xl opacity-20">H</span>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHand: [],
    aiHand: [],
    discardPile: [],
    currentPlayer: 'player',
    status: 'START',
    winner: null,
    selectedSuit: null,
  });

  const [message, setMessage] = useState<string>("欢迎来到疯狂 8 点！");

  const initGame = () => {
    const fullDeck = shuffle(createDeck());
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    
    // Initial discard must not be an 8 for simplicity, or just handle it
    let initialDiscard = fullDeck.pop()!;
    while (initialDiscard.rank === Rank.EIGHT) {
      fullDeck.unshift(initialDiscard);
      initialDiscard = fullDeck.pop()!;
    }

    setGameState({
      deck: fullDeck,
      playerHand,
      aiHand,
      discardPile: [initialDiscard],
      currentPlayer: 'player',
      status: 'PLAYING',
      winner: null,
      selectedSuit: null,
    });
    setMessage("你的回合！出牌或摸牌。");
  };

  const checkWinner = (state: GameState) => {
    if (state.playerHand.length === 0) return 'player';
    if (state.aiHand.length === 0) return 'ai';
    return null;
  };

  const canPlay = (card: CardData, topCard: CardData, selectedSuit: Suit | null) => {
    if (card.rank === Rank.EIGHT) return true;
    const targetSuit = selectedSuit || topCard.suit;
    return card.suit === targetSuit || card.rank === topCard.rank;
  };

  const handlePlayerPlay = (card: CardData) => {
    if (gameState.currentPlayer !== 'player' || gameState.status !== 'PLAYING') return;
    
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!canPlay(card, topCard, gameState.selectedSuit)) {
      setMessage("这张牌不能出！请匹配花色或点数。");
      return;
    }

    const newPlayerHand = gameState.playerHand.filter(c => c.id !== card.id);
    const newDiscardPile = [...gameState.discardPile, card];
    
    if (card.rank === Rank.EIGHT) {
      setGameState(prev => ({
        ...prev,
        playerHand: newPlayerHand,
        discardPile: newDiscardPile,
        status: 'SUIT_SELECTION',
      }));
      setMessage("你出了 8！请选择一个新的花色。");
    } else {
      const nextState: GameState = {
        ...gameState,
        playerHand: newPlayerHand,
        discardPile: newDiscardPile,
        currentPlayer: 'ai',
        selectedSuit: null,
      };
      
      const winner = checkWinner(nextState);
      if (winner) {
        setGameState({ ...nextState, status: 'GAME_OVER', winner });
      } else {
        setGameState(nextState);
        setMessage("AI 正在思考...");
      }
    }
  };

  const handleDraw = (player: 'player' | 'ai') => {
    if (gameState.status !== 'PLAYING') return;
    if (gameState.deck.length === 0) {
      setMessage("摸牌堆已空，跳过回合。");
      setGameState(prev => ({ ...prev, currentPlayer: player === 'player' ? 'ai' : 'player' }));
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    
    if (player === 'player') {
      setGameState(prev => ({
        ...prev,
        deck: newDeck,
        playerHand: [...prev.playerHand, drawnCard],
        currentPlayer: 'ai'
      }));
      setMessage("你摸了一张牌。AI 的回合。");
    } else {
      setGameState(prev => ({
        ...prev,
        deck: newDeck,
        aiHand: [...prev.aiHand, drawnCard],
        currentPlayer: 'player'
      }));
      setMessage("AI 摸了一张牌。你的回合！");
    }
  };

  const handleSuitSelection = (suit: Suit) => {
    const nextState: GameState = {
      ...gameState,
      status: 'PLAYING',
      selectedSuit: suit,
      currentPlayer: 'ai',
    };
    
    const winner = checkWinner(nextState);
    if (winner) {
      setGameState({ ...nextState, status: 'GAME_OVER', winner });
    } else {
      setGameState(nextState);
      setMessage(`你选择了 ${suit === Suit.HEARTS ? '红心' : suit === Suit.DIAMONDS ? '方块' : suit === Suit.CLUBS ? '梅花' : '黑桃'}。AI 的回合。`);
    }
  };

  // AI Logic
  useEffect(() => {
    if (gameState.currentPlayer === 'ai' && gameState.status === 'PLAYING' && !gameState.winner) {
      const timer = setTimeout(() => {
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const playableCards = gameState.aiHand.filter(c => canPlay(c, topCard, gameState.selectedSuit));

        if (playableCards.length > 0) {
          // AI plays a card
          const cardToPlay = playableCards[0];
          const newAiHand = gameState.aiHand.filter(c => c.id !== cardToPlay.id);
          const newDiscardPile = [...gameState.discardPile, cardToPlay];
          
          if (cardToPlay.rank === Rank.EIGHT) {
            // AI picks a suit (most frequent suit in its hand)
            const suitCounts: Record<string, number> = { [Suit.HEARTS]: 0, [Suit.DIAMONDS]: 0, [Suit.CLUBS]: 0, [Suit.SPADES]: 0 };
            newAiHand.forEach(c => suitCounts[c.suit]++);
            const bestSuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b) as Suit;
            
            const nextState: GameState = {
              ...gameState,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              currentPlayer: 'player',
              selectedSuit: bestSuit,
            };
            const winner = checkWinner(nextState);
            setGameState(winner ? { ...nextState, status: 'GAME_OVER', winner } : nextState);
            setMessage(`AI 出了 8 并选择了 ${bestSuit === Suit.HEARTS ? '红心' : bestSuit === Suit.DIAMONDS ? '方块' : bestSuit === Suit.CLUBS ? '梅花' : '黑桃'}。你的回合！`);
          } else {
            const nextState: GameState = {
              ...gameState,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              currentPlayer: 'player',
              selectedSuit: null,
            };
            const winner = checkWinner(nextState);
            setGameState(winner ? { ...nextState, status: 'GAME_OVER', winner } : nextState);
            setMessage("AI 出了一张牌。你的回合！");
          }
        } else {
          handleDraw('ai');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.status]);

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto p-4 font-sans select-none">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-display tracking-wider text-white drop-shadow-md">Heather疯狂 8 点</h1>
        <div className="flex items-center gap-4 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
          <div className="text-sm font-medium">
            牌堆: <span className="font-bold">{gameState.deck.length}</span>
          </div>
          <div className="text-sm font-medium">
            AI 手牌: <span className="font-bold">{gameState.aiHand.length}</span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col justify-between relative">
        {/* AI Hand */}
        <div className="flex justify-center -space-x-12 sm:-space-x-16 h-32">
          {gameState.aiHand.map((card, idx) => (
            <Card key={card.id} card={card} isFaceUp={false} />
          ))}
        </div>

        {/* Center: Discard and Draw Piles */}
        <div className="flex justify-center items-center gap-8 my-8">
          {/* Draw Pile */}
          <div className="relative group" onClick={() => gameState.currentPlayer === 'player' && handleDraw('player')}>
            <div className="absolute -inset-1 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
            <Card 
              card={{ id: 'back', suit: Suit.HEARTS, rank: Rank.ACE }} 
              isFaceUp={false} 
              isSelectable={gameState.currentPlayer === 'player' && gameState.status === 'PLAYING'}
            />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest opacity-60">摸牌</div>
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={topCard?.id}
                initial={{ x: -100, opacity: 0, rotate: -15 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                {topCard && <Card card={topCard} isFaceUp={true} isHighlighted={true} />}
              </motion.div>
            </AnimatePresence>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest opacity-60">弃牌</div>
            
            {/* Selected Suit Indicator for 8s */}
            {gameState.selectedSuit && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow-xl"
              >
                <SuitIcon suit={gameState.selectedSuit} className="w-6 h-6" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 h-40">
          {gameState.playerHand.map((card) => (
            <Card 
              key={card.id} 
              card={card} 
              isFaceUp={true} 
              isSelectable={gameState.currentPlayer === 'player' && gameState.status === 'PLAYING' && canPlay(card, topCard, gameState.selectedSuit)}
              onClick={() => handlePlayerPlay(card)}
            />
          ))}
        </div>
      </main>

      {/* Status Message */}
      <footer className="mt-4 text-center">
        <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-lg">
          <p className="text-lg font-medium">{message}</p>
        </div>
      </footer>

      {/* Overlays */}
      <AnimatePresence>
        {/* Start Screen */}
        {gameState.status === 'START' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#FF8C00] p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-white text-center"
            >
              <h2 className="text-4xl font-display mb-6">疯狂 8 点</h2>
              <div className="text-left space-y-4 mb-8 bg-white/10 p-4 rounded-xl">
                <p className="flex items-start gap-2"><Info className="w-5 h-5 mt-1 shrink-0" /> 匹配弃牌堆顶牌的花色或点数。</p>
                <p className="flex items-start gap-2"><Info className="w-5 h-5 mt-1 shrink-0" /> <b>8</b> 是万能牌，可以随时出并改变花色。</p>
                <p className="flex items-start gap-2"><Info className="w-5 h-5 mt-1 shrink-0" /> 如果没牌可出，必须摸一张牌。</p>
                <p className="flex items-start gap-2"><Info className="w-5 h-5 mt-1 shrink-0" /> 最先出完手牌的人获胜！</p>
              </div>
              <button 
                onClick={initGame}
                className="w-full py-4 bg-white text-[#FF8C00] rounded-xl font-bold text-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Play className="fill-current" /> 开始游戏
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Suit Selection Modal */}
        {gameState.status === 'SUIT_SELECTION' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-xs w-full text-center"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">选择新花色</h3>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelection(suit)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all group"
                  >
                    <SuitIcon suit={suit} className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-600 font-bold">
                      {suit === Suit.HEARTS ? '红心' : suit === Suit.DIAMONDS ? '方块' : suit === Suit.CLUBS ? '梅花' : '黑桃'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Game Over Screen */}
        {gameState.status === 'GAME_OVER' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center border-8 border-orange-500"
            >
              <div className="mb-6">
                {gameState.winner === 'player' ? (
                  <div className="text-6xl mb-4">🏆</div>
                ) : (
                  <div className="text-6xl mb-4">🤖</div>
                )}
                <h2 className="text-4xl font-display text-gray-800">
                  {gameState.winner === 'player' ? '你赢了！' : 'AI 赢了！'}
                </h2>
              </div>
              <p className="text-gray-500 mb-8">
                {gameState.winner === 'player' ? '太棒了，你清空了所有手牌！' : '别灰心，下次一定能赢！'}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={initGame}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <RotateCcw className="w-5 h-5" /> 再来一局
                </button>
                <button 
                  onClick={() => setGameState(prev => ({ ...prev, status: 'START' }))}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" /> 不玩了
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
