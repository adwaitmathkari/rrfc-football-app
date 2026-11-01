import { Chip, type ChipProps } from '@mui/material';
import type { Team } from '../utils/format';

interface TeamChipProps extends Omit<ChipProps, 'color'> {
  team: Team | null;
}

/** Player chip coloured by team: Blue, White, or unassigned (dashed). */
export function TeamChip({ team, sx, ...props }: TeamChipProps) {
  const teamSx =
    team === 'blue'
      ? { bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }
      : team === 'white'
        ? { bgcolor: '#fff', color: 'text.primary', border: 1, borderColor: 'grey.400', '&:hover': { bgcolor: 'grey.100' } }
        : { bgcolor: 'transparent', border: '1px dashed', borderColor: 'grey.500' };
  return <Chip size="small" {...props} sx={[teamSx, ...(Array.isArray(sx) ? sx : [sx])]} />;
}
