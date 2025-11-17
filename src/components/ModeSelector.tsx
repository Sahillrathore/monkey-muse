import { Button } from '@/components/ui/button';
import { TestMode } from '@/utils/wordGenerator';

interface ModeSelectorProps {
  selectedMode: TestMode;
  onModeChange: (mode: TestMode) => void;
  disabled?: boolean;
}

const ModeSelector = ({ selectedMode, onModeChange, disabled }: ModeSelectorProps) => {
  const modes: { value: TestMode; label: string }[] = [
    { value: 'words', label: 'words' },
    { value: 'adjectives', label: 'adjectives' },
    { value: 'numbers', label: 'numbers' },
    { value: 'characters', label: 'characters' },
  ];

  return (
    <div className="flex gap-1">
      {modes.map((mode) => (
        <Button
          key={mode.value}
          variant={selectedMode === mode.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange(mode.value)}
          disabled={disabled}
          className={`
            font-mono text-sm
            ${selectedMode === mode.value 
              ? 'bg-primary text-primary-foreground px-2 py-0' 
              : 'text-muted-foreground hover:text-black'
            }
          `}
        >
          {mode.label}
        </Button>
      ))}
    </div>
  );
};

export default ModeSelector;
