import EditIcon from '@mui/icons-material/Edit';
import PlaceIcon from '@mui/icons-material/Place';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import type { Game } from '../api/types';
import { formatDate } from '../utils/format';
import { TeamChip } from './TeamChip';

interface Props {
  game: Game;
  nameOf: (userId: string) => string;
  highlighted?: boolean;
  onEdit?: () => void;
}

export function GameCard({ game, nameOf, highlighted = false, onEdit }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted]);

  return (
    <Card
      ref={ref}
      variant="outlined"
      sx={highlighted ? { borderColor: 'secondary.main', borderWidth: 2 } : undefined}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Box>
              <Typography variant="h6">
                {formatDate(game.date)} · {game.timeFrom}–{game.timeTo}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                <PlaceIcon fontSize="small" />
                <Typography variant="body2">{game.location}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Match #{game.id.slice(0, 8)}
              </Typography>
            </Box>
            {onEdit && (
              <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>
                Edit
              </Button>
            )}
          </Stack>

          <Typography variant="h5" sx={{ textAlign: 'center' }}>
            {game.score ? (
              <>
                Blue <strong>{game.score.team1}</strong> – <strong>{game.score.team2}</strong> White
              </>
            ) : (
              <Typography component="span" color="text.secondary">
                Blue vs White
              </Typography>
            )}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TeamList title="Blue" team="blue" ids={game.team1} nameOf={nameOf} />
            <TeamList title="White" team="white" ids={game.team2} nameOf={nameOf} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface TeamListProps {
  title: string;
  team: 'blue' | 'white';
  ids: string[];
  nameOf: (userId: string) => string;
}

function TeamList({ title, team, ids, nameOf }: TeamListProps) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="subtitle2" gutterBottom>
        {title} ({ids.length})
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {ids.map((id) => (
          <TeamChip key={id} team={team} label={nameOf(id)} />
        ))}
      </Box>
    </Box>
  );
}
