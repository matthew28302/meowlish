import { describe, expect, it } from 'vitest';
import { VOCABULARY_LIST } from '@/lib/data/vocabulary';

const VALID_TYPES = ['noun', 'verb', 'adjective', 'phrase', 'idiom'] as const;
const VALID_CATEGORIES = [
  'it-scrum',
  'it-review',
  'it-bug',
  'it-architecture',
  'it-interview',
  'office-english',
  'daily-cafe',
  'daily-smalltalk',
  'daily-travel',
  'daily-opinion',
  'daily-family',
  'daily-food',
  'daily-health',
  'daily-shopping',
  'daily-fun',
  'daily-weather',
] as const;

describe('VOCABULARY_LIST schema', () => {
  it('has a healthy number of entries', () => {
    expect(VOCABULARY_LIST.length).toBeGreaterThan(100);
  });

  it('every id is unique', () => {
    const ids = VOCABULARY_LIST.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has all required non-empty fields', () => {
    expect(VOCABULARY_LIST.length).toBeGreaterThan(0);
    for (const v of VOCABULARY_LIST) {
      expect(v.id.length, `entry id non-empty`).toBeGreaterThan(0);
      expect(v.word.length, `entry "${v.id}" word`).toBeGreaterThan(0);
      expect(v.phonetic.length, `entry "${v.id}" phonetic`).toBeGreaterThan(0);
      expect(v.meaningVi.length, `entry "${v.id}" meaningVi`).toBeGreaterThan(0);
      expect(v.definitionEn.length, `entry "${v.id}" definitionEn`).toBeGreaterThan(0);
      expect(v.exampleSentence.length, `entry "${v.id}" exampleSentence`).toBeGreaterThan(0);
      expect(v.exampleTranslation.length, `entry "${v.id}" exampleTranslation`).toBeGreaterThan(0);
      expect(v.tips.length, `entry "${v.id}" tips`).toBeGreaterThan(0);
      expect(v.categoryName.length, `entry "${v.id}" categoryName`).toBeGreaterThan(0);
      expect(v.icon.length, `entry "${v.id}" icon`).toBeGreaterThan(0);
      expect(Array.isArray(v.collocations), `entry "${v.id}" collocations array`).toBe(true);
      expect(v.collocations.length, `entry "${v.id}" collocations`).toBeGreaterThan(0);
    }
  });

  it('type field belongs to the union', () => {
    for (const v of VOCABULARY_LIST) {
      expect(
        (VALID_TYPES as readonly string[]).includes(v.type),
        `entry "${v.id}" type "${v.type}"`,
      ).toBe(true);
    }
  });

  it('category field belongs to the union', () => {
    for (const v of VOCABULARY_LIST) {
      expect(
        (VALID_CATEGORIES as readonly string[]).includes(v.category),
        `entry "${v.id}" category "${v.category}"`,
      ).toBe(true);
    }
  });

  it('phonetic (IPA) is wrapped in slashes and non-blank', () => {
    for (const v of VOCABULARY_LIST) {
      expect(v.phonetic.startsWith('/'), `entry "${v.id}" IPA starts with /`).toBe(true);
      expect(v.phonetic.endsWith('/'), `entry "${v.id}" IPA ends with /`).toBe(true);
      expect(
        v.phonetic.replaceAll('/', '').trim().length,
        `entry "${v.id}" IPA not blank`,
      ).toBeGreaterThan(0);
    }
  });

  it('spot-checks known entries', () => {
    const byId = new Map(VOCABULARY_LIST.map((v) => [v.id, v]));
    expect(byId.get('it-1')?.word).toBe('blocker');
    expect(byId.get('it-1')?.category).toBe('it-scrum');
    const words = new Set(VOCABULARY_LIST.map((v) => v.word));
    expect(words.has('refactor')).toBe(true);
    expect(words.has('catch up')).toBe(true);
  });
});
