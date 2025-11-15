import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy } from 'lucide-react';
import Confetti from 'react-confetti';
import DetailedAnalysis from './DetailedAnalysis';

// Define the shape of our score objects
interface ScoreEntry {
  wpm: number;
  accuracy: number;
  timestamp: string;
  selectedTime: number;
}

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

interface TestResultsProps {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  keystrokeData: KeystrokeData[];
  keyAccuracy: Map<string, KeyAccuracy>;
  selectedTime: number;
  onRestart: () => void;
}

// Storage keys
const RECENT_SCORES_KEY = 'typingTest_recentScores';
const HIGH_SCORE_KEY = 'typingTest_highScore';

const TestResults = ({
  wpm,
  accuracy,
  correctChars,
  incorrectChars,
  keystrokeData,
  keyAccuracy,
  selectedTime,
  onRestart
}: TestResultsProps) => {

  // --- NEW STATE ---
  // State to track if this is a new high score
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  // State to store the user's best score for display
  const [bestScore, setBestScore] = useState(0);
  // State for confetti size
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [recentScores, setRecentScores] = useState<ScoreEntry[]>([]);

  // --- UPDATED LOGIC ---
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    // 1. Get recent scores
    const recentScoresRaw = localStorage.getItem(RECENT_SCORES_KEY);
    const loadedRecentScores: ScoreEntry[] = recentScoresRaw ? JSON.parse(recentScoresRaw) : [];

    // 5. Create new score WITH selectedTime
    const newScore: ScoreEntry = {
      wpm,
      accuracy,
      timestamp: new Date().toISOString(),
      selectedTime: selectedTime // <-- ADD THIS
    };

    // 6. Update list and save
    const updatedRecentScores = [newScore, ...loadedRecentScores].slice(0, 5);
    localStorage.setItem(RECENT_SCORES_KEY, JSON.stringify(updatedRecentScores));

    // 7. Set state for rendering
    setRecentScores(updatedRecentScores);

    // 2. Check and update high score (WPM)
    const highScoreRaw = localStorage.getItem(HIGH_SCORE_KEY);
    const oldHighScore = highScoreRaw ? parseFloat(highScoreRaw) : 0;

    setBestScore(oldHighScore);

    if (wpm > oldHighScore) {
      localStorage.setItem(HIGH_SCORE_KEY, wpm.toString());
      setIsNewHighScore(true);
      setBestScore(wpm);
    }

    // 8. Add selectedTime to dependency array
  }, [wpm, accuracy, selectedTime]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">

      {/* --- NEW: Confetti Component --- */}
      {isNewHighScore && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          tweenDuration={8000}
          gravity={0.1}
        />
      )}

      <div className="w-full max-w-5xl space-y-8 text-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-muted-foreground">Test Analysis</h2>

          {/* --- NEW: High Score Message --- */}
          {isNewHighScore && (
            <div className="flex animate-pulse items-center justify-center gap-2 rounded-lg bg-yellow-400/10 p-4 text-2xl font-semibold text-yellow-400">
              <Trophy className="h-6 w-6" />
              New High Score!
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="space-y-2">
              <div className="text-sm uppercase tracking-wider text-muted-foreground">WPM</div>
              {/* --- NEW: Dynamic Color for WPM --- */}
              <div
                className={`text-6xl font-bold tabular-nums ${isNewHighScore ? 'text-yellow-400' : 'text-primary'
                  }`}
              >
                {wpm}
              </div>
              {/* --- NEW: Show Best Score --- */}
              {!isNewHighScore && (
                <div className="text-lg text-muted-foreground">
                  Best: {Math.round(bestScore)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm uppercase tracking-wider text-muted-foreground">Accuracy</div>
              <div className="text-6xl font-bold text-foreground tabular-nums">
                {accuracy}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-border">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Correct</div>
              <div className="text-2xl font-semibold text-green-500 tabular-nums">
                {correctChars}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Incorrect</div>
              <div className="text-2xl font-semibold text-red-500 tabular-nums">
                {incorrectChars}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={onRestart}
          size="lg"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>

        <DetailedAnalysis
          keystrokeData={keystrokeData}
          keyAccuracy={keyAccuracy}
        />

        <div className="w-full max-w-5xl space-y-4 text-left pt-4 border-t border-border">
          <h3 className="text-xl font-semibold text-muted-foreground">
            Recent Tests
          </h3>
          <div className="space-y-2">
            {recentScores.length === 0 ? (
              <p className="text-muted-foreground">No recent tests found.</p>
            ) : (
              recentScores.map((score, index) => (
                <div
                  key={score.timestamp}
                  className="flex items-center justify-between rounded-lg bg-card p-3 px-4 shadow-sm"
                >
                  <div className="flex items-baseline gap-6">
                    <div className="text-lg font-semibold tabular-nums">
                      {score.wpm}{' '}
                      <span className="text-sm font-normal text-muted-foreground">WPM</span>
                    </div>
                    <div className="text-lg tabular-nums">
                      {score.accuracy}%{' '}
                      <span className="text-sm font-normal text-muted-foreground">Acc</span>
                    </div>
                  </div>
                  <div className="font-mono text-sm text-muted-foreground">
                    {score.selectedTime}s
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TestResults;