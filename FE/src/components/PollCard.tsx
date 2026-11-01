import LockIcon from '@mui/icons-material/Lock';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { api } from '../api/endpoints';
import type { Poll } from '../api/types';
import { errorMessage, formatDateTime } from '../utils/format';

interface Props {
  poll: Poll;
  nameOf: (userId: string) => string;
  onUpdated?: (poll: Poll) => void;
}

export function PollCard({ poll, nameOf, onUpdated }: Props) {
  const [selected, setSelected] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canVote = !poll.closed && !poll.hasVoted;
  const myOption = poll.options.find((o) => o.id === poll.myOptionId);

  const vote = async () => {
    setSubmitting(true);
    setError(null);
    try {
      onUpdated?.(await api.vote(poll.id, selected));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6">{poll.question}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                {poll.closed ? 'Closed' : 'Closes'} {formatDateTime(poll.validUntil)}
              </Typography>
              {poll.displayAfterClosed && !poll.closed && (
                <Chip size="small" variant="outlined" label="Results shown after closing" />
              )}
            </Stack>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {canVote && (
            <>
              <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
                {poll.options.map((o) => (
                  <FormControlLabel key={o.id} value={o.id} control={<Radio />} label={o.text} />
                ))}
              </RadioGroup>
              <Box>
                <Button variant="contained" onClick={vote} disabled={!selected || submitting}>
                  Submit vote
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  You can vote only once.
                </Typography>
              </Box>
            </>
          )}

          {poll.hasVoted && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <LockIcon fontSize="small" color="action" />
              <Typography variant="body2">
                You voted: <strong>{myOption?.text}</strong>
              </Typography>
            </Stack>
          )}
          {poll.closed && !poll.hasVoted && (
            <Typography variant="body2" color="text.secondary">
              You did not vote in this poll.
            </Typography>
          )}

          {poll.results ? (
            <Results poll={poll} nameOf={nameOf} />
          ) : (
            poll.hasVoted && (
              <Typography variant="body2" color="text.secondary">
                Results will be visible when the poll closes.
              </Typography>
            )
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Results({ poll, nameOf }: { poll: Poll; nameOf: (id: string) => string }) {
  const results = poll.results ?? [];
  const total = results.reduce((sum, r) => sum + r.count, 0);

  return (
    <Stack spacing={1.5}>
      {poll.options.map((option) => {
        const result = results.find((r) => r.optionId === option.id);
        const count = result?.count ?? 0;
        const percent = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <Box key={option.id}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: option.id === poll.myOptionId ? 700 : 400 }}>
                {option.text}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {count} ({percent}%)
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 1 }} />
            {result && result.voterIds.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {result.voterIds.map(nameOf).join(', ')}
              </Typography>
            )}
          </Box>
        );
      })}
      <Typography variant="caption" color="text.secondary">
        {total} vote{total === 1 ? '' : 's'}
      </Typography>
    </Stack>
  );
}
