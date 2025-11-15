import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface TimerSelectorProps {
  selectedTime: number;
  onTimeChange: (time: number) => void;
  disabled?: boolean;
}

const TimerSelector = ({ selectedTime, onTimeChange, disabled }: TimerSelectorProps) => {
  const times = [15, 30, 60];
  const [customTime, setCustomTime] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCustomTimeSubmit = () => {
    const time = parseInt(customTime);
    if (time && time > 0 && time <= 300) {
      onTimeChange(time);
      setShowCustomInput(false);
      setCustomTime('');
    }
  };

  const isCustomSelected = !times.includes(selectedTime);

  return (
    <div className="flex gap-2 items-center">
      {times.map((time) => (
        <Button
          key={time}
          variant={selectedTime === time ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTimeChange(time)}
          disabled={disabled}
          className={`
            font-mono text-sm
            ${selectedTime === time
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-zinc-800'
            }
          `}
        >
          {time}
        </Button>
      ))}

      {showCustomInput ? (
        <div className="flex gap-1 items-center">

          <Input
            type="number"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCustomTimeSubmit();
              }

              // ADD THIS LINE:
              // This stops the key event from reaching the parent div's
              // onKeyDown listener, so you can type numbers.
              e.stopPropagation();
            }}
            placeholder="sec"
            className="w-32 h-8 text-sm font-mono"
            min="1"
            max="300"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCustomTimeSubmit}
            className="h-8 px-2 text-xs"
          >
            ✓
          </Button>
        </div>
      ) : (
        <Button
          variant={isCustomSelected ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setShowCustomInput(true)}
          disabled={disabled}
          className={`
            font-mono text-sm
            ${isCustomSelected
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-zinc-800'
            }
          `}
        >
          {isCustomSelected ? selectedTime : 'custom'}
        </Button>
      )}
    </div>
  );
};

export default TimerSelector;
