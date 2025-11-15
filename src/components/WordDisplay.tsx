import { TestStatus } from './TypingTest';
import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';

interface TypedCharData {
  status: 'correct' | 'incorrect';
  char: string;
}

interface WordDisplayProps {
  words: string[];
  currentWordIndex: number;
  currentCharIndex: number;
  // OLD:
  // typedChars: { [key: string]: string };
  // NEW:
  typedChars: { [key: string]: TypedCharData };
  status: TestStatus;
}

const LINE_HEIGHT_ESTIMATE = 57;

const WordDisplay: React.FC<WordDisplayProps> = ({
  words,
  currentWordIndex,
  currentCharIndex,
  typedChars,
  status
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wordElsRef = useRef(new Map<number, HTMLDivElement>());
  const charElsRef = useRef(new Map<string, HTMLSpanElement>());

  const [translateY, setTranslateY] = useState(0);

  // caret measured relative to *wrapper* (px)
  const [caretLeft, setCaretLeft] = useState(0);
  const [caretTop, setCaretTop] = useState(0);
  const [caretHeight, setCaretHeight] = useState(20);
  const [showCaret, setShowCaret] = useState(false);

  // vertical translate (same logic)
  useEffect(() => {
    const currentWordEl = wordElsRef.current.get(currentWordIndex);
    if (!currentWordEl) {
      setTranslateY(0);
      return;
    }
    const targetTranslateY = currentWordEl.offsetTop - LINE_HEIGHT_ESTIMATE;
    setTranslateY(Math.max(0, targetTranslateY));
  }, [currentWordIndex, words]);

  // measure caret position relative to wrapper (so caret moves together with wrapper while it animates)
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (status !== 'running') {
      setShowCaret(false);
      return;
    }
    setShowCaret(true);

    const measure = () => {
      const curKey = `${currentWordIndex}-${currentCharIndex}`;
      const charEl = charElsRef.current.get(curKey);

      const wordEl = wordElsRef.current.get(currentWordIndex);
      if (!wordEl) {
        // fallback: caret at top-left of wrapper
        setCaretLeft(0);
        setCaretTop(0);
        setCaretHeight(20);
        return;
      }

      const wrapperRect = wrapper.getBoundingClientRect();
      // If exact char exists, position caret at its left (relative to wrapper)
      if (charEl) {
        const charRect = charEl.getBoundingClientRect();
        const left = charRect.left - wrapperRect.left;
        const top = charRect.top - wrapperRect.top;
        setCaretLeft(left);
        setCaretTop(top);
        setCaretHeight(charRect.height);
        return;
      }

      // If no exact char (caret could be at end of word), place after last char
      const lastIdx = Math.max(
        0,
        Math.min((words[currentWordIndex] ?? '').length - 1, currentCharIndex - 1)
      );
      const lastKey = `${currentWordIndex}-${lastIdx}`;
      const lastEl = charElsRef.current.get(lastKey);
      if (lastEl) {
        const lastRect = lastEl.getBoundingClientRect();
        const left = lastRect.left - wrapperRect.left + lastRect.width;
        const top = lastRect.top - wrapperRect.top;
        setCaretLeft(left);
        setCaretTop(top);
        setCaretHeight(lastRect.height);
        return;
      }

      // Fallback: caret at start of the word element
      const wordRect = wordEl.getBoundingClientRect();
      setCaretLeft(wordRect.left - wrapperRect.left);
      setCaretTop(wordRect.top - wrapperRect.top);
      setCaretHeight(wordRect.height);
    };

    // Measure now (useLayoutEffect) — but also schedule one rAF after paint for cases where layout changes due to animation
    measure();
    const raf = requestAnimationFrame(() => {
      measure();
    });

    return () => cancelAnimationFrame(raf);
  }, [currentWordIndex, currentCharIndex, words, status]);

  const getExtraTypedKeysForWord = (wordIdx: number) =>
    Object.keys(typedChars)
      .map((k) => {
        const [wIdxStr, cIdxStr] = k.split('-');
        return { key: k, wIdx: Number(wIdxStr), cIdx: Number(cIdxStr) };
      })
      .filter((t) => t.wIdx === wordIdx && t.cIdx >= (words[wordIdx]?.length ?? 0))
      .sort((a, b) => a.cIdx - b.cIdx)
      .map((t) => t.key);

  return (
    <div className="relative bg-card rounded-lg p-4 h-48 overflow-hidden" ref={containerRef}>
      {/* wrapper is the element that is translated; make it position:relative so caret can be absolute inside it */}
      <div
        ref={wrapperRef}
        className="flex flex-wrap gap-x-3 gap-y-2 text-3xl leading-relaxed"
        style={{
          position: 'relative',
          transform: `translateY(-${translateY}px)`,
          transition: 'transform 220ms linear'
        }}
      >
        {words.map((word, wordIdx) => {
          const isCurrentWord = wordIdx === currentWordIndex;
          const isPastWord = wordIdx < currentWordIndex;

          return (
            <div
              key={wordIdx}
              ref={(el) => {
                if (el) wordElsRef.current.set(wordIdx, el);
                else wordElsRef.current.delete(wordIdx);
              }}
              className={`relative transition-opacity ${isPastWord ? 'opacity-30' : 'opacity-100'}`}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {word.split('').map((char, charIdx) => {
                // const key = `${wordIdx}-${charIdx}`;
                const key = `${wordIdx}-${charIdx}`;
                const typedData = typedChars[key];
                const typedStatus = typedData?.status; // Get the status from the object
                const isCurrent = isCurrentWord && charIdx === currentCharIndex;

                let className = 'word-char ';
                if (isCurrent) className += 'current ';
                if (typedStatus === 'correct') className += 'correct'; // Use typedStatus
                else if (typedStatus === 'incorrect') className += 'incorrect'; // Use typedStatus

                return (
                  <span
                    key={charIdx}
                    ref={(el) => {
                      if (el) charElsRef.current.set(key, el);
                      else charElsRef.current.delete(key);
                    }}
                    className={className}
                    style={{ whiteSpace: 'pre' }}
                  >
                    {char}
                  </span>
                );
              })}

              {getExtraTypedKeysForWord(wordIdx).map((extraKey) => {
                const typedData = typedChars[extraKey];
                const typedStatus = typedData?.status;
                const typedChar = typedData?.char; // <-- Get the actual typed char!

                return (
                  <span
                    key={extraKey}
                    ref={(el) => {
                      if (el) charElsRef.current.set(extraKey, el);
                      else charElsRef.current.delete(extraKey);
                    }}
                    className={`word-extra ${typedStatus === 'incorrect' ? 'incorrect' : ''}`}
                    // style={{ whiteSpace: 'pre' }}
                  >
                    {typedChar} {/* <-- Render the char, not '?' */}
                  </span>
                );
              })}
            </div>
          );
        })}

        {/* caret lives inside the wrapper so it translates with the wrapper transform */}
        {showCaret && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(${caretLeft}px, ${caretTop}px)`,
              transition: 'transform 120ms cubic-bezier(.2,.8,.2,1), height 120ms linear, opacity 120ms linear',
              width: 2,
              height: caretHeight,
              backgroundColor: '#f59e0b',
              pointerEvents: 'none',
              zIndex: 40,
              willChange: 'transform'
            }}
          />
        )}
      </div>

      <style>{`
        .word-char, .word-extra {
          display: inline-block;
          position: relative;
          padding: 0 1px;
        }
        .word-char.correct { color: #f9fafb; }   /* white-ish */
        .word-char.incorrect { color: #ef4444; } /* red */
        .word-extra { color: #ef4444; opacity: 0.95; }
      `}</style>
    </div>
  );
};

export default WordDisplay;
