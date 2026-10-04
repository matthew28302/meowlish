import { describe, expect, it } from 'vitest';
import { DICTIONARY, lookupWord } from '@/lib/data/dictionary';

describe('lookupWord dictionary', () => {
  it('returns exact entry for a known word', () => {
    const e = lookupWord('blocker');
    expect(e.word).toBe('blocker');
    expect(e.phonetic.length).toBeGreaterThan(0);
    expect(e.vietnamese.length).toBeGreaterThan(0);
    expect(e.example.length).toBeGreaterThan(0);
    expect(e.partOfSpeech.length).toBeGreaterThan(0);
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(lookupWord('BLOCKER').word).toBe('blocker');
    expect(lookupWord('  refactor  ').word).toBe('refactor');
    expect(lookupWord('  PULL REQUEST ').word).toBe('pull request');
  });

  it('resolves multi-word phrase keys exactly', () => {
    const e = lookupWord('pull request');
    expect(e.word).toBe('pull request');
    expect(e.vietnamese).toContain('gộp code');
  });

  it('falls back via substring match when sentence contains a key', () => {
    const e = lookupWord('I have a blocker with database credentials');
    expect(e.word).toBe('blocker');
  });

  it('falls back via reverse-substring when input is a prefix of a key', () => {
    // 'sync' is contained in key 'sync up'
    const e = lookupWord('sync');
    expect(e.word).toBe('sync up');
  });

  it('returns a contextual fallback for unknown words', () => {
    const raw = 'quantumfluxxyz';
    const e = lookupWord(raw);
    expect(e.word).toBe(raw);
    expect(e.partOfSpeech).toBe('word / phrase');
    expect(e.vietnamese).toContain(raw);
    expect(e.phonetic).toBe(`/${raw.toLowerCase()}/`);
    expect(e.notes?.length ?? 0).toBeGreaterThan(0);
  });

  it('fallback preserves original casing in word but lowercases phonetic', () => {
    const e = lookupWord('  HelloWorld  ');
    expect(e.word).toBe('HelloWorld');
    expect(e.phonetic).toBe('/helloworld/');
  });

  it('every DICTIONARY entry has complete fields', () => {
    const entries = Object.entries(DICTIONARY);
    expect(entries.length).toBeGreaterThan(10);
    for (const [key, e] of entries) {
      expect(e.word.length, `entry "${key}" word`).toBeGreaterThan(0);
      expect(e.phonetic.length, `entry "${key}" phonetic`).toBeGreaterThan(0);
      expect(e.partOfSpeech.length, `entry "${key}" partOfSpeech`).toBeGreaterThan(0);
      expect(e.vietnamese.length, `entry "${key}" vietnamese`).toBeGreaterThan(0);
      expect(e.example.length, `entry "${key}" example`).toBeGreaterThan(0);
    }
  });
});
