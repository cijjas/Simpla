import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Maximize2, Minimize2, FileText, LayoutList } from 'lucide-react';

interface NormaControlsProps {
  onToggleExpansion: () => void;
  isExpanded: boolean;
  onToggleOriginal: () => void;
  showOriginal: boolean;
  hasOriginalText: boolean;
  hasStructure: boolean;
}

export function NormaControls({
  onToggleExpansion,
  isExpanded,
  onToggleOriginal,
  showOriginal,
  hasOriginalText,
  hasStructure,
}: NormaControlsProps) {
  return (
    <ButtonGroup>
      {hasStructure && (
        <ButtonGroup>
          <Button variant="outline" onClick={onToggleExpansion}>
            {isExpanded ? (
              <>
                <Minimize2 className="h-4 w-4" />
                Contraer
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                Expandir
              </>
            )}
          </Button>
        </ButtonGroup>
      )}
      {hasOriginalText && (
        <ButtonGroup>
          <Button variant="outline" onClick={onToggleOriginal}>
            {showOriginal ? (
              <>
                <LayoutList className="h-4 w-4" />
                Ver estructura
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Ver original
              </>
            )}
          </Button>
        </ButtonGroup>
      )}
    </ButtonGroup>
  );
}