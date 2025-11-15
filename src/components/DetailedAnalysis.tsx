import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';

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

interface DetailedAnalysisProps {
  keystrokeData: KeystrokeData[];
  keyAccuracy: Map<string, KeyAccuracy>;
}

const DetailedAnalysis = ({ keystrokeData, keyAccuracy }: DetailedAnalysisProps) => {
  const chartData = keystrokeData.map((data, index) => ({
    second: index + 1,
    wpm: data.wpm,
    accuracy: data.accuracy,
  }));

  const keyAccuracyArray = Array.from(keyAccuracy.values())
    .filter(ka => ka.correct + ka.incorrect > 0)
    .sort((a, b) => (a.correct + a.incorrect) - (b.correct + b.incorrect))
    .reverse();

  const strongKeys = keyAccuracyArray
    .filter(ka => ka.accuracy >= 90 && ka.correct + ka.incorrect >= 3)
    .slice(0, 10);

  const weakKeys = keyAccuracyArray
    .filter(ka => ka.accuracy < 70 && ka.correct + ka.incorrect >= 3)
    .slice(0, 10);

  const chartConfig = {
    wpm: {
      label: "WPM",
      color: "hsl(var(--primary))",
    },
    accuracy: {
      label: "Accuracy",
      color: "hsl(var(--success))",
    },
  };

  return (
    <div className="w-full space-y-6 ">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Performance Over Time</h3>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="second" 
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="wpm"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.2)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="hsl(var(--success))"
              fill="hsl(var(--success) / 0.2)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strongKeys.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-success">Strong Keys</h3>
            <div className="space-y-2">
              {strongKeys.map((ka) => (
                <div key={ka.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <kbd className="px-3 py-1 bg-muted rounded font-mono text-foreground border border-border">
                      {ka.key}
                    </kbd>
                    <span className="text-muted-foreground">
                      {ka.correct + ka.incorrect} times
                    </span>
                  </div>
                  <span className="font-semibold text-success tabular-nums">
                    {ka.accuracy.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {weakKeys.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-error">Weak Keys</h3>
            <div className="space-y-2">
              {weakKeys.map((ka) => (
                <div key={ka.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <kbd className="px-3 py-1 bg-muted rounded font-mono text-foreground border border-border">
                      {ka.key}
                    </kbd>
                    <span className="text-muted-foreground">
                      {ka.correct + ka.incorrect} times
                    </span>
                  </div>
                  <span className="font-semibold text-error tabular-nums">
                    {ka.accuracy.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DetailedAnalysis;
