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
          <Button variant="outline" onClick={onToggleExpansion} className="gap-2">
            {isExpanded ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Contraer</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Expandir</span>
              </>
            )}
          </Button>
        </ButtonGroup>
      )}
      {hasOriginalText && (
        <ButtonGroup>
          <Button variant="outline" onClick={onToggleOriginal} className="gap-2">
            {showOriginal ? (
              <>
                <LayoutList className="h-4 w-4" />
                <span className="hidden sm:inline">Ver estructura</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Ver original</span>
              </>
            )}
          </Button>
        </ButtonGroup>
      )}
    </ButtonGroup>
  );
}