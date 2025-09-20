'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bird } from './Bird';
import { Cloud } from './Cloud';
import {
  BIRD_START_Y_PERCENT,
  GRAVITY_FACTOR,
  FLAP_STRENGTH_FACTOR,
  PIPE_WIDTH_PERCENT,
  PIPE_GAP_PERCENT,
  PIPE_SPEED_FACTOR,
  PIPE_SPAWN_RATE,
  COIN_SIZE_PERCENT,
  COIN_SPAWN_CHANCE,
  BIRD_WIDTH_PERCENT,
  BIRD_HEIGHT_PERCENT,
  BIRD_START_X_PERCENT,
  BIRD_ROTATION_SPEED,
  MAX_BIRD_ROTATION,
  MIN_BIRD_ROTATION,
} from '@/lib/game-constants';
import { useGameSounds } from '@/hooks/useGameSounds';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Wallet, Video } from 'lucide-react';
import { WithdrawDialog } from './WithdrawDialog';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

type GameState = 'loading' | 'start' | 'playing' | 'over';

type Pipe = {
  x: number;
  gapY: number;
  scored?: boolean;
};

type CollectibleCoin = {
  id: number;
  x: number;
  y: number;
};

type CloudState = {
    id: number;
    x: number;
    y: number;
    scale: number;
    opacity: number;
    speed: number;
};

type PlayerData = {
    uid: string;
    points: number;
};

const INITIAL_CLOUDS = 10;
const UNIQUE_USER_ID_KEY = 'skyward_soar_user_id';
const AD_COOLDOWN_SECONDS = 5;

export const SkywardSoarGame = () => {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [isWithdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Ad button state
  const [isAdButtonDisabled, setIsAdButtonDisabled] = useState(false);
  const [adCooldown, setAdCooldown] = useState(0);

  // User and Firebase state
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [gameDimensions, setGameDimensions] = useState({ width: 0, height: 0 });

  const birdPosition = useRef(0);
  const birdVelocity = useRef(0);
  const birdRotation = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const coins = useRef<CollectibleCoin[]>([]);
  const clouds = useRef<CloudState[]>([]);
  const frameCount = useRef(0);
  const loopId = useRef<number>();

  const [isFlapping, setIsFlapping] = useState(false);
  const [, setRender] = useState({}); // Force re-render
  
  const { playFlap, playCoin, playHit, initializeAudio } = useGameSounds();
  
  const BIRD_START_Y = gameDimensions.height * BIRD_START_Y_PERCENT;
  const GRAVITY = gameDimensions.height * GRAVITY_FACTOR;
  const FLAP_STRENGTH = -(gameDimensions.height * FLAP_STRENGTH_FACTOR);
  const PIPE_WIDTH = gameDimensions.width * PIPE_WIDTH_PERCENT;
  const PIPE_GAP = gameDimensions.height * PIPE_GAP_PERCENT;
  const PIPE_SPEED = -(gameDimensions.width * PIPE_SPEED_FACTOR);
  const COIN_SIZE = gameDimensions.width * COIN_SIZE_PERCENT;
  const BIRD_WIDTH = gameDimensions.width * BIRD_WIDTH_PERCENT;
  const BIRD_HEIGHT = gameDimensions.height * BIRD_HEIGHT_PERCENT;
  const BIRD_START_X = gameDimensions.width * BIRD_START_X_PERCENT;

  // --- Firebase & Initialization ---

  const getOrCreateUserId = useCallback((): string => {
    let userId = localStorage.getItem(UNIQUE_USER_ID_KEY);
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem(UNIQUE_USER_ID_KEY, userId);
    }
    return userId;
  }, []);

  const handleFirebase = useCallback(async () => {
    setLoadingProgress(30);
    const userId = getOrCreateUserId();
    const userDocRef = doc(db, 'users', userId);
    let currentPlayerData: PlayerData;
    setLoadingProgress(50);

    try {
        const userDoc = await getDoc(userDocRef);
        setLoadingProgress(80);
        if (userDoc.exists()) {
            const data = userDoc.data();
            currentPlayerData = {
                uid: userId,
                points: data.points || 0
            };
        } else {
            currentPlayerData = {
                uid: userId,
                points: 0
            };
            await setDoc(userDocRef, {
                points: 0,
            });
        }
        setScore(currentPlayerData.points);
        setPlayerData(currentPlayerData);
    } catch (error) {
        console.error("Firebase error:", error);
        toast({
            title: 'خطأ في الاتصال',
            description: 'فشل الاتصال بقاعدة البيانات. ستعمل اللعبة محليًا.',
            variant: 'destructive',
        });
        setPlayerData({uid: userId, points: 0}); 
    } finally {
        setIsFirebaseConnected(true);
        setLoadingProgress(100);
        setGameState('start');
    }
  }, [getOrCreateUserId, toast]);

    useEffect(() => {
        if (gameState === 'loading') {
          handleFirebase();
        }
    }, [gameState, handleFirebase]);
  
  useEffect(() => {
    const updateDimensions = () => {
      const container = gameContainerRef.current;
      if (container) {
        setGameDimensions({ width: container.clientWidth, height: container.clientHeight });
      } else {
        setGameDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const initializeClouds = useCallback(() => {
    if (gameDimensions.width === 0) return;
    clouds.current = Array.from({ length: INITIAL_CLOUDS }).map((_, i) => ({
      id: i,
      x: Math.random() * gameDimensions.width,
      y: Math.random() * gameDimensions.height,
      scale: Math.random() * 0.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.3,
      speed: Math.random() * 0.5 + 0.2,
    }));
  }, [gameDimensions.width, gameDimensions.height]);


  const resetGame = useCallback(() => {
    if (!gameDimensions.height) return;
    birdPosition.current = BIRD_START_Y;
    birdVelocity.current = 0;
    birdRotation.current = 0;
    pipes.current = [];
    coins.current = [];
    frameCount.current = 0;
    setScore(playerData?.points ?? 0);
    initializeClouds();
  }, [gameDimensions.height, BIRD_START_Y, initializeClouds, playerData]);

  useEffect(() => {
    if (gameState === 'start') {
        resetGame();
    }
  }, [gameState, resetGame]);

  // --- Score Syncing ---

  const incrementScore = useCallback(async (points: number) => {
    const newScore = score + points;
    setScore(newScore);

    if (isFirebaseConnected && playerData) {
        try {
            const userDocRef = doc(db, 'users', playerData.uid);
            await updateDoc(userDocRef, { points: newScore });
            setPlayerData(prev => prev ? { ...prev, points: newScore } : null);
        } catch (error) {
            console.error("Failed to sync score with Firebase:", error);
            toast({
              title: "خطأ في المزامنة",
              description: "فشل حفظ النقاط في قاعدة البيانات.",
              variant: "destructive",
            })
        }
    }
  }, [score, isFirebaseConnected, playerData, toast]);


  // --- Game Actions ---
  
  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
  }, [resetGame]);
  
  const gameOver = useCallback(() => {
    playHit();
    setGameState('over');
  }, [playHit]);

  const handleFlap = useCallback(async () => {
    await initializeAudio();
    if (gameState === 'over' || gameState === 'loading' || gameDimensions.height === 0) return;
    
    if (gameState === 'start') {
        startGame();
    }
    
    birdVelocity.current = FLAP_STRENGTH;
    playFlap();
    setIsFlapping(true);
    setTimeout(() => setIsFlapping(false), 150);

  }, [gameState, gameDimensions.height, playFlap, startGame, initializeAudio, FLAP_STRENGTH]);

 const handleWithdrawSuccess = useCallback((amount: number) => {
    incrementScore(-amount);
    toast({
        title: 'نجاح!',
        description: `تم إرسال طلب السحب.`,
    });
 }, [incrementScore, toast]);

 const restartGame = useCallback(() => {
    setGameState('start');
 }, []);

  // --- Game Loop ---
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') {
        loopId.current = requestAnimationFrame(gameLoop);
        return;
    }
    
    birdVelocity.current += GRAVITY;
    birdPosition.current += birdVelocity.current;
    
    birdRotation.current = Math.min(
        Math.max(MIN_BIRD_ROTATION, birdVelocity.current * BIRD_ROTATION_SPEED),
        MAX_BIRD_ROTATION
    );

    clouds.current.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x < -120 * cloud.scale) {
            cloud.x = gameDimensions.width;
            cloud.y = Math.random() * gameDimensions.height;
        }
    });

    pipes.current.forEach(pipe => (pipe.x += PIPE_SPEED));
    
    if (frameCount.current % PIPE_SPAWN_RATE === 0) {
      const gapY = Math.random() * (gameDimensions.height - PIPE_GAP - 150) + (PIPE_GAP / 2) + 75;
      pipes.current.push({ x: gameDimensions.width, gapY });

      if (Math.random() < COIN_SPAWN_CHANCE) {
        coins.current.push({
          id: Date.now(),
          x: gameDimensions.width + PIPE_WIDTH / 2,
          y: gapY + (Math.random() - 0.5) * (PIPE_GAP * 0.7),
        });
      }
    }
    
    coins.current.forEach(coin => (coin.x += PIPE_SPEED));

    const unscoredPipe = pipes.current.find(p => !p.scored && p.x + PIPE_WIDTH < BIRD_START_X);
    if (unscoredPipe) {
        unscoredPipe.scored = true;
        incrementScore(5);
    }
    
    if (birdPosition.current > gameDimensions.height - BIRD_HEIGHT || birdPosition.current < 0) {
      gameOver();
    }

    const birdRect = {
      x: BIRD_START_X - BIRD_WIDTH / 2,
      y: birdPosition.current,
      width: BIRD_WIDTH,
      height: BIRD_HEIGHT
    };

    for (const pipe of pipes.current) {
        const pipeCollision = 
            birdRect.x + birdRect.width > pipe.x &&
            birdRect.x < pipe.x + PIPE_WIDTH &&
            (birdRect.y < pipe.gapY - PIPE_GAP / 2 ||
             birdRect.y + birdRect.height > pipe.gapY + PIPE_GAP / 2);
        
        if (pipeCollision) {
            gameOver();
            break;
        }
    }

    const collectedCoinIds = new Set<number>();
    for (const coin of coins.current) {
      const coinRect = { x: coin.x - COIN_SIZE / 2, y: coin.y - COIN_SIZE / 2, width: COIN_SIZE, height: COIN_SIZE };
      if (
        birdRect.x < coinRect.x + coinRect.width &&
        birdRect.x + birdRect.width > coinRect.x &&
        birdRect.y < coinRect.y + coinRect.height &&
        birdRect.y + birdRect.height > coinRect.y
      ) {
        playCoin();
        collectedCoinIds.add(coin.id);
        incrementScore(10);
      }
    }

    if (collectedCoinIds.size > 0) {
      coins.current = coins.current.filter(c => !collectedCoinIds.has(c.id));
    }
    pipes.current = pipes.current.filter(pipe => pipe.x > -PIPE_WIDTH);
    coins.current = coins.current.filter(coin => coin.x > -COIN_SIZE);
    
    frameCount.current++;
    setRender({});
    
    loopId.current = requestAnimationFrame(gameLoop);
  }, [gameState, gameDimensions, GRAVITY, PIPE_SPEED, PIPE_WIDTH, PIPE_GAP, COIN_SIZE, BIRD_WIDTH, BIRD_HEIGHT, BIRD_START_X, playCoin, gameOver, incrementScore, BIRD_ROTATION_SPEED]);


  useEffect(() => {
    loopId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (loopId.current) {
        cancelAnimationFrame(loopId.current);
      }
    };
  }, [gameLoop]);


  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleFlap();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleFlap]);

  const handleRewardedAd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdButtonDisabled) return;

    setIsAdButtonDisabled(true);
    setAdCooldown(AD_COOLDOWN_SECONDS);

    const cooldownInterval = setInterval(() => {
        setAdCooldown(prev => {
            if (prev <= 1) {
                clearInterval(cooldownInterval);
                setIsAdButtonDisabled(false);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    const rewardAmount = 10;
    incrementScore(rewardAmount);
    toast({
        title: `تمت إضافة ${rewardAmount} نقاط!`,
        description: 'شكرًا لمشاهدتك الإعلان.',
    });
  };

  const renderLoadingScreen = () => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background">
      <div className="w-4/5 max-w-sm text-center">
        <h2 className="text-4xl font-bold text-primary-foreground mb-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.2)'}}>
          التحليق نحو السماء
        </h2>
        <Progress value={loadingProgress} className="w-full h-2 bg-primary/20 border border-primary/50" />
        <p className="text-sm text-primary-foreground mt-2">
            جاري تحميل اللعبة...
        </p>
      </div>
    </div>
  );

  return (
    <>
    <div
      ref={gameContainerRef}
      className="relative overflow-hidden bg-background cursor-pointer w-screen h-screen"
      onClick={handleFlap}
      tabIndex={0}
    >
      {gameState === 'loading' && renderLoadingScreen()}

      {clouds.current.map(cloud => (
          <Cloud key={cloud.id} {...cloud} />
      ))}
      
      {gameState !== 'loading' && <Bird y={birdPosition.current} rotation={birdRotation.current} isFlapping={isFlapping} />}

      {gameState === 'playing' && pipes.current.map((pipe, i) => (
        <React.Fragment key={i}>
          <div
            className="absolute bg-accent border-2 border-accent-foreground rounded-b-md"
            style={{
              left: pipe.x,
              top: 0,
              width: PIPE_WIDTH,
              height: pipe.gapY - PIPE_GAP / 2,
            }}
          />
          <div
            className="absolute bg-accent border-2 border-accent-foreground rounded-t-md"
            style={{
              left: pipe.x,
              top: pipe.gapY + PIPE_GAP / 2,
              width: PIPE_WIDTH,
              height: gameDimensions.height - (pipe.gapY + PIPE_GAP / 2),
            }}
          />
        </React.Fragment>
      ))}

      {gameState === 'playing' && coins.current.map(coin => (
        <div
          key={coin.id}
          className="absolute rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md"
          style={{
            left: coin.x,
            top: coin.y,
            width: COIN_SIZE,
            height: COIN_SIZE,
          }}
        >
          <Star size={COIN_SIZE * 0.7} fill="currentColor" />
        </div>
      ))}
      
      {isFirebaseConnected && gameState !== 'loading' && (
        <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-2 text-white bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
              <div className="flex items-center gap-2">
                  <Star className="text-primary" fill="currentColor" size={24}/>
                  <span className="text-3xl font-bold font-headline tracking-wider">{score}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setWithdrawDialogOpen(true); }} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                  <Wallet size={28}/>
              </button>
            </div>
        </div>
      )}
      
      {gameState === 'start' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40">
           <Card className="w-4/5 max-w-sm text-center">
             <CardHeader>
               <CardTitle className="text-3xl font-headline">التحليق نحو السماء</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground mb-4">انقر لبدء اللعب</p>
               <Button onClick={(e) => { e.stopPropagation(); startGame(); }} size="lg">ابدأ اللعبة</Button>
             </CardContent>
           </Card>
        </div>
      )}

      {gameState === 'over' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40">
           <Card className="w-4/5 max-w-sm text-center">
             <CardHeader>
               <CardTitle className="text-4xl font-headline">انتهت اللعبة</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-lg mb-2">نتيجتك النهائية:</p>
                <p className="text-5xl font-bold mb-6">{score}</p>
                <div className="flex flex-col gap-2">
                    <Button onClick={(e) => { e.stopPropagation(); restartGame(); }} size="lg">العب مرة أخرى</Button>
                    <Button onClick={handleRewardedAd} size="lg" variant="secondary" disabled={isAdButtonDisabled}>
                        <Video className="mr-2" size={20}/>
                        {isAdButtonDisabled ? `انتظر ${adCooldown} ثانية...` : 'شاهد إعلان +10 نقاط'}
                    </Button>
                </div>
             </CardContent>
           </Card>
        </div>
      )}
    </div>
    <WithdrawDialog 
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
        currentScore={score}
        onWithdrawSuccess={handleWithdrawSuccess}
        userId={playerData?.uid}
    />
    </>
  );
};
