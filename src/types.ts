/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface VocabularyItem {
  word: string;
  translation: string;
  phonetic?: string;
  example: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  translation: string;
}

export interface GrammarPoint {
  title: string;
  explanation: string;
  examples: string[];
}

export interface Exercise {
  question: string;
  type: 'multiple-choice' | 'fill-in-the-blank' | 'translation';
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface LessonChapter {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  dialogue: DialogueLine[];
  vocabulary: VocabularyItem[];
  grammar: GrammarPoint[];
  exercises: Exercise[];
}

export interface LanguageCourse {
  language: string;
  level: DifficultyLevel;
  chapters: LessonChapter[];
}
