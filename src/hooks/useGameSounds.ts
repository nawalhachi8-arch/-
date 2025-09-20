'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

type Synths = {
  flapSynth: Tone.Synth;
  coinSynth: Tone.Synth;
  hitSynth: Tone.MembraneSynth;
};

export function useGameSounds() {
  const synths = useRef<Synths | null>(null);
  const isInitialized = useRef(false);

  const initializeAudio = useCallback(async () => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    await Tone.start();

    const flapSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();

    const coinSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0, release: 0.1 },
    }).toDestination();

    const hitSynth = new Tone.MembraneSynth({
      pitchDecay: 0.1,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.01, release: 1.4, attackCurve: 'exponential' },
    }).toDestination();

    synths.current = { flapSynth, coinSynth, hitSynth };
  }, []);

  useEffect(() => {
    return () => {
      if (synths.current) {
        synths.current.flapSynth.dispose();
        synths.current.coinSynth.dispose();
        synths.current.hitSynth.dispose();
      }
    };
  }, []);

  const playFlap = useCallback(() => {
    if (synths.current) {
      synths.current.flapSynth.triggerAttackRelease('C5', '8n', Tone.now());
    }
  }, []);

  const playCoin = useCallback(() => {
    if (synths.current) {
      synths.current.coinSynth.triggerAttackRelease('E6', '16n', Tone.now());
      setTimeout(() => {
         if (synths.current) {
            synths.current.coinSynth.triggerAttackRelease('G6', '16n', Tone.now() + 0.1);
         }
      }, 50);
    }
  }, []);

  const playHit = useCallback(() => {
    if (synths.current) {
      synths.current.hitSynth.triggerAttackRelease('C2', '8n', Tone.now());
    }
  }, []);

  return { playFlap, playCoin, playHit, initializeAudio };
}
