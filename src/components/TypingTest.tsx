import { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { generateRow, TestMode } from '@/utils/wordGenerator';
import { RotateCcw } from 'lucide-react';
// @ts-ignore
import { Button } from '@/components/ui/button';
import TestResults from './TestResults';
import TimerSelector from './TimerSelector';
import WordDisplay from './WordDisplay';
import ModeSelector from './ModeSelector';

export type TestStatus = 'idle' | 'running' | 'finished';

interface KeystrokeData {
  timestamp: number;
  wpm: number;
  accuracy: number;
}

interface KeyAccuracy {
  key: string;
  correct: number;
  incorrect: number;
  accuracy: number;
}

const TypingTest = () => {
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<TestStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedTime, setSelectedTime] = useState(30);
  const [selectedMode, setSelectedMode] = useState<TestMode>('words');
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [typedChars, setTypedChars] = useState<{ [key: string]: string }>({});
  const [keystrokeData, setKeystrokeData] = useState<KeystrokeData[]>([]);
  const [keyAccuracy, setKeyAccuracy] = useState<Map<string, KeyAccuracy>>(new Map());
  const [startTime, setStartTime] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const WORDS_TO_GENERATE = 70; // Generate 50 words at a time
  const WORDS_BUFFER = 20; // Add more words when 20 are left

  useEffect(() => {
    // Start with an initial set of words
    setWords(generateRow(WORDS_TO_GENERATE, selectedMode));
  }, [selectedMode]);

  useEffect(() => {
    if (status === 'running' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);

        // Record keystroke data every second
        const currentWPM = calculateWPM();
        const currentAccuracy = calculateAccuracy();
        setKeystrokeData(prev => [...prev, {
          timestamp: Date.now() - startTime,
          wpm: currentWPM,
          accuracy: currentAccuracy
        }]);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && status === 'running') {
      setStatus('finished');
    }
  }, [timeLeft, status]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const handleStart = () => {
    if (status === 'idle') {
      setStatus('running');
      setStartTime(Date.now());
      inputRef.current?.focus();
    }
  };

  const handleRestart = () => {
    setWords(generateRow(WORDS_TO_GENERATE, selectedMode));
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setInput('');
    setStatus('idle');
    setTimeLeft(selectedTime);
    setCorrectChars(0);
    setIncorrectChars(0);
    setTypedChars({});
    setKeystrokeData([]);
    setKeyAccuracy(new Map());
    inputRef.current?.focus();
  };

  const isLetter = (k: string) => /^[a-zA-Z]$/.test(k);

  const handleModeChange = (mode: TestMode) => {
    setSelectedMode(mode);
    if (status !== 'running') {
      handleRestart();
    }
  };

  const handleTimeChange = (time: number) => {
    setSelectedTime(time);
    setTimeLeft(time);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (status === 'finished') return;

    if (status === 'idle') {
      if (isLetter(e.key)) {
        handleStart();
      } else {
        e.preventDefault();
        return;
      }
    }

    const currentWord = words[currentWordIndex];

    if (e.key === ' ') {
      e.preventDefault();
      if (input.length > 0) {
        const newWordIndex = currentWordIndex + 1;

        // Check if we need to add more words
        if (newWordIndex > words.length - WORDS_BUFFER) {
          setWords(prevWords => [
            ...prevWords,
            ...generateRow(WORDS_TO_GENERATE, selectedMode)
          ]);
        }

        setCurrentWordIndex(newWordIndex);
        setCurrentCharIndex(0);
        setInput('');
      }
      return;
    }

    if (e.key === 'Backspace') {
      if (input.length > 0) {
        const newInput = input.slice(0, -1);
        setInput(newInput);
        setCurrentCharIndex(Math.max(0, currentCharIndex - 1));

        const key = `${currentWordIndex}-${currentCharIndex - 1}`;
        const newTypedChars = { ...typedChars };
        delete newTypedChars[key];
        setTypedChars(newTypedChars);
      }
      return;
    }

    if (e.key.length === 1) {
      const newInput = input + e.key;
      setInput(newInput);

      const isCorrect = currentWord[currentCharIndex] === e.key;
      const key = `${currentWordIndex}-${currentCharIndex}`;

      setTypedChars({
        ...typedChars,
        [key]: isCorrect ? 'correct' : 'incorrect',
      });

      const keyChar = e.key;
      const currentKeyAccuracy = keyAccuracy.get(keyChar) || {
        key: keyChar,
        correct: 0,
        incorrect: 0,
        accuracy: 0,
      };

      if (isCorrect) {
        setCorrectChars(correctChars + 1);
        currentKeyAccuracy.correct += 1;
      } else {
        setIncorrectChars(incorrectChars + 1);
        currentKeyAccuracy.incorrect += 1;
      }

      const total = currentKeyAccuracy.correct + currentKeyAccuracy.incorrect;
      currentKeyAccuracy.accuracy = (currentKeyAccuracy.correct / total) * 100;

      const newKeyAccuracy = new Map(keyAccuracy);
      newKeyAccuracy.set(keyChar, currentKeyAccuracy);
      setKeyAccuracy(newKeyAccuracy);

      setCurrentCharIndex(currentCharIndex + 1);
    }
  };


  const calculateWPM = () => {
    const timeElapsed = selectedTime - timeLeft;
    if (timeElapsed === 0) return 0;
    return Math.round((correctChars / 5) / (timeElapsed / 60));
  };

  const calculateAccuracy = () => {
    const total = correctChars + incorrectChars;
    if (total === 0) return 100;
    return Math.round((correctChars / total) * 100);
  };

  if (status === 'finished') {
    return (
      <TestResults
        wpm={calculateWPM()}
        accuracy={calculateAccuracy()}
        correctChars={correctChars}
        incorrectChars={incorrectChars}
        keystrokeData={keystrokeData}
        keyAccuracy={keyAccuracy}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-screen px-4 py-8 focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyPress}
    >
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-center">
          <ModeSelector
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
            disabled={status === 'running'}
          />
        </div>

        <div className="flex items-center justify-between">
          <TimerSelector
            selectedTime={selectedTime}
            onTimeChange={handleTimeChange}
            disabled={status === 'running'}
          />
          <div className="flex items-center gap-6">
            <div className="text-4xl font-bold text-primary tabular-nums">
              {timeLeft}
            </div>
          </div>
        </div>

        <WordDisplay
          words={words}
          currentWordIndex={currentWordIndex}
          currentCharIndex={currentCharIndex}
          typedChars={typedChars}
          status={status}
        />

        <input
          ref={inputRef}
          type="text"
          className="typing-input" // Use CSS to hide this
          value={input}
          onChange={() => { }}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />

        <div className='flex justify-center'>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRestart}
            className="text-muted-foreground hover:text-foreground mx-auto"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {status === 'idle' && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 transform text-center text-muted-foreground text-sm animate-fade-in pointer-events-none">
            Click here or start typing to begin the test
          </div>
        )}
      </div>
      {/* Add this style to hide the input, as it was in your original code */}
      <style>{`
        .typing-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default TypingTest;