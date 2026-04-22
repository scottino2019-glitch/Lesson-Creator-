/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LessonChapter } from "../types";

export function exportLessonToHTML(courseTitle: string, chapters: LessonChapter[]): string {
  const chaptersHTML = chapters.map((chapter, chapterIdx) => `
    <article class="chapter">
      <header class="chapter-header">
        <h2 class="chapter-title">Capitolo ${chapterIdx + 1}: ${chapter.title}</h2>
        <span class="difficulty-tag">${chapter.difficulty}</span>
      </header>
      
      <section class="section">
        <h2>Dialogo Immersivo</h2>
        <div class="dialogue-container">
          ${chapter.dialogue.map(d => `
            <div class="dialogue-item">
              <span class="speaker-name">${d.speaker}</span>
              <span class="text-foreign">"${d.text}"</span>
              <span class="text-translation">${d.translation}</span>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="section">
        <h2>Vocabolario Essenziale</h2>
        <div class="vocab-list">
          ${chapter.vocabulary.map(v => `
            <div class="vocab-card">
              <div class="vocab-head">
                <span class="word">${v.word}</span>
                ${v.phonetic ? `<span class="phon">[${v.phonetic}]</span>` : ''}
                <span class="transl">${v.translation}</span>
              </div>
              <div class="example-sentence">
                <strong>Contesto:</strong> ${v.example}
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="section">
        <h2>Approfondimento Grammaticale</h2>
        <div class="grammar-card">
          <h3>${chapter.grammar[0]?.title || 'Grammatica Corrente'}</h3>
          <p>${chapter.grammar[0]?.explanation || 'Spiegazione dei concetti chiave.'}</p>
          <ul class="grammar-list">
            ${(chapter.grammar[0]?.examples || []).map(ex => `<li>"${ex}"</li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="section">
        <h2>Esercizi Interattivi</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
          Clicca sulle opzioni o inserisci la risposta per verificare la tua conoscenza.
        </p>
        <div class="exercises-container">
          ${chapter.exercises.map((e, eIdx) => {
            const exerciseId = `ex-${chapterIdx}-${eIdx}`;
            return `
            <div class="exercise-item" id="${exerciseId}" data-answer="${e.answer.replace(/"/g, '&quot;')}">
              <span class="ex-label">Esercizio ${chapterIdx + 1}.${eIdx + 1} &bull; ${e.type.replace(/-/g, ' ')}</span>
              <div class="ex-question">${e.question}</div>
              
              ${e.options && e.options.length > 0 ? `
                <div class="ex-options">
                  ${e.options.map(opt => `
                    <div class="ex-option" onclick="checkOption(this, '${e.answer.replace(/"/g, '&quot;')}')">${opt}</div>
                  `).join('')}
                </div>
              ` : `
                <div class="ex-input-group">
                  <input type="text" class="ex-input" placeholder="Scrivi la tua risposta qui..." onkeypress="if(event.key === 'Enter') checkInput(this, '${e.answer.replace(/"/g, '&quot;')}')">
                  <button class="ex-check-btn" onclick="checkInput(this.previousElementSibling, '${e.answer.replace(/"/g, '&quot;')}')">Controlla</button>
                </div>
              `}

              <div class="ex-feedback" style="display: none;">
                <div class="ex-solution-text">
                  <strong>Risposta Corretta:</strong> <span class="correct-val">${e.answer}</span>
                </div>
                ${e.explanation ? `<div class="ex-explanation-text">${e.explanation}</div>` : ''}
              </div>
            </div>
          `}).join('')}
        </div>
      </section>
    </article>
  `).join('');

  const answerKeyHTML = `
    <section class="answer-key" style="page-break-before: always; margin-top: 100px;">
      <h2 style="font-size: 2rem; border-bottom: 3px solid var(--text-main); padding-bottom: 15px;">Chiave delle Risposte</h2>
      <p style="margin-bottom: 30px; color: var(--text-muted);">Usa questa sezione per verificare il tuo lavoro dopo aver completato gli esercizi.</p>
      
      ${chapters.map((chapter, chapterIdx) => `
        <div style="margin-bottom: 40px;">
          <h3 style="color: var(--accent); margin-bottom: 15px;">Capitolo ${chapterIdx + 1}: ${chapter.title}</h3>
          <div style="display: grid; gap: 15px;">
            ${chapter.exercises.map((e, eIdx) => `
              <div style="padding: 15px; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border);">
                <div style="font-weight: 800; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;">
                  Es. ${chapterIdx + 1}.${eIdx + 1}
                </div>
                <div style="font-weight: 600;">Risposta: <span style="color: var(--accent);">${e.answer}</span></div>
                ${e.explanation ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">${e.explanation}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </section>
  `;

  return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${courseTitle}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Lora:ital,wght@0,400;0,700;1,400&display=swap');
        
        :root {
            --bg: #ffffff;
            --text-main: #1a1a1a;
            --text-muted: #5e5e5e;
            --accent: #2563eb;
            --accent-soft: #eff6ff;
            --border: #e5e7eb;
            --card-bg: #f9fafb;
        }

        * { box-sizing: border-box; }
        
        body { 
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif; 
            line-height: 1.7; 
            max-width: 850px; 
            margin: 0 auto; 
            padding: 60px 40px; 
            background-color: var(--bg); 
            color: var(--text-main);
            -webkit-print-color-adjust: exact;
        }

        .header-main {
            text-align: center;
            border-bottom: 3px solid var(--text-main);
            padding-bottom: 30px;
            margin-bottom: 60px;
        }

        .header-main h1 { 
            font-size: 3rem; 
            margin: 0; 
            font-weight: 800;
            letter-spacing: -0.04em;
        }

        .chapter { 
            margin-bottom: 100px;
            page-break-before: always;
        }

        .chapter:first-of-type { page-break-before: auto; }

        .chapter-header {
            margin-bottom: 40px;
        }

        .chapter-title {
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--text-main);
            margin: 0;
            line-height: 1.2;
        }

        .difficulty-tag {
            display: inline-block;
            background: var(--accent);
            color: white;
            font-size: 0.7rem;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 100px;
            font-weight: 700;
            margin-top: 10px;
            letter-spacing: 0.05em;
        }

        h2 { 
            font-size: 1.4rem;
            margin-top: 40px;
            margin-bottom: 20px;
            font-weight: 700;
            border-bottom: 1px solid var(--border);
            padding-bottom: 10px;
        }

        .section { margin: 40px 0; }

        /* Dialogue Style */
        .dialogue-container {
            margin: 20px 0;
        }
        .dialogue-item {
            margin-bottom: 24px;
            padding-left: 20px;
            position: relative;
        }
        .dialogue-item::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: var(--accent);
            opacity: 0.3;
        }
        .speaker-name {
            display: block;
            font-weight: 800;
            font-size: 0.7rem;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 4px;
        }
        .text-foreign {
            font-family: 'Lora', serif;
            font-size: 1.25rem;
            font-style: italic;
            color: var(--text-main);
            display: block;
            margin-bottom: 6px;
        }
        .text-translation {
            font-size: 0.95rem;
            color: var(--text-muted);
            display: block;
        }

        /* Vocabulary Table-like Grid */
        .vocab-list {
            display: grid;
            gap: 15px;
        }
        .vocab-card {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid var(--border);
        }
        .vocab-head {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 8px;
        }
        .word { font-size: 1.3rem; font-weight: 700; color: var(--accent); }
        .phon { font-family: monospace; color: var(--text-muted); font-size: 0.9rem; }
        .transl { font-weight: 600; color: var(--text-main); }
        .example-sentence {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid var(--border);
            font-size: 0.9rem;
            color: var(--text-muted);
            font-style: italic;
        }

        /* Grammar Box */
        .grammar-card {
            border: 2px solid var(--text-main);
            padding: 30px;
            border-radius: 4px;
            margin: 30px 0;
        }
        .grammar-card h3 { margin-top: 0; font-size: 1.5rem; }
        .grammar-card p { font-size: 1.05rem; }
        .grammar-list { padding-left: 20px; margin-top: 20px; }
        .grammar-list li { margin-bottom: 12px; font-family: 'Lora', serif; font-style: italic; }

        /* Exercises Section */
        .exercise-item {
            background: white;
            border: 1px solid var(--border);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 25px;
        }
        .ex-label {
            display: inline-block;
            background: var(--text-main);
            color: white;
            font-size: 0.6rem;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        .ex-question {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 20px;
        }
        .ex-options {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-bottom: 20px;
        }
        .ex-option {
            padding: 12px 18px;
            border: 1px solid var(--border);
            border-radius: 10px;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .ex-option:hover {
            border-color: var(--accent);
            background: var(--accent-soft);
        }
        .ex-option.correct {
            background: #dcfce7;
            border-color: #22c55e;
            color: #166534;
        }
        .ex-option.wrong {
            background: #fee2e2;
            border-color: #ef4444;
            color: #991b1b;
        }

        .ex-input-group {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .ex-input {
            flex: 1;
            padding: 12px 15px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-family: inherit;
        }
        .ex-check-btn {
            background: var(--text-main);
            color: white;
            border: none;
            padding: 0 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }

        .ex-feedback {
            margin-top: 20px;
            padding: 20px;
            background: var(--card-bg);
            border-radius: 10px;
            border: 1px solid var(--border);
            animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .ex-solution-text {
            color: var(--text-main);
            font-weight: 700;
            margin-bottom: 8px;
        }
        .ex-explanation-text {
            font-size: 0.85rem;
            color: var(--text-muted);
            line-height: 1.5;
        }

        .answer-key { 
            display: none; 
        }

        @media print { 
            body { padding: 40px; }
            .chapter { border: none; } 
            .exercise-item { box-shadow: none; border: 1px solid #ddd; }
            .answer-key { display: block; }
            .ex-check-btn, .ex-input { display: none; }
        }
    </style>
    <script>
        function checkOption(el, correctAnswer) {
            const container = el.closest('.exercise-item');
            if (container.classList.contains('answered')) return;
            
            const options = container.querySelectorAll('.ex-option');
            const feedback = container.querySelector('.ex-feedback');
            
            container.classList.add('answered');
            
            if (el.innerText.trim() === correctAnswer.trim()) {
                el.classList.add('correct');
            } else {
                el.classList.add('wrong');
                // Find and highlight correct one
                options.forEach(opt => {
                    if (opt.innerText.trim() === correctAnswer.trim()) opt.classList.add('correct');
                });
            }
            
            feedback.style.display = 'block';
        }

        function checkInput(input, correctAnswer) {
            const container = input.closest('.exercise-item');
            if (container.classList.contains('answered')) return;
            
            const feedback = container.querySelector('.ex-feedback');
            container.classList.add('answered');
            
            const isCorrect = input.value.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
            input.style.borderColor = isCorrect ? '#22c55e' : '#ef4444';
            input.style.backgroundColor = isCorrect ? '#dcfce7' : '#fee2e2';
            
            feedback.style.display = 'block';
        }
    </script>
</head>
<body>
        <div class="header-main">
            <h1>${courseTitle}</h1>
            <p style="color: var(--text-muted); font-weight: 600;">Materiale Didattico Professionale</p>
        </div>
        ${chaptersHTML}
        ${answerKeyHTML}
        <footer>
          Documento generato da LinguaCraft AI • Strumenti per l'eccellenza nell'apprendimento
        </footer>
    </div>
</body>
</html>
  `;
}

export function downloadHTML(filename: string, content: string) {
  const element = document.createElement('a');
  const file = new Blob([content], {type: 'text/html'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
