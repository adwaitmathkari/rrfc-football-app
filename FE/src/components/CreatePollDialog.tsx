import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { type FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { errorMessage, toDateTimeLocal } from '../utils/format';

const MAX_OPTIONS = 10;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const tomorrow = () => toDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));

export function CreatePollDialog({ open, onClose, onCreated }: Props) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [validUntil, setValidUntil] = useState(tomorrow);
  const [displayAfterClosed, setDisplayAfterClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setQuestion('');
    setOptions(['', '']);
    setValidUntil(tomorrow());
    setDisplayAfterClosed(false);
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createPoll({
        question: question.trim(),
        options: options.map((o) => o.trim()),
        validUntil: new Date(validUntil).toISOString(),
        displayAfterClosed,
      });
      reset();
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>New poll</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              required
              autoFocus
            />

            <Typography variant="subtitle2">Options</Typography>
            {options.map((option, i) => (
              <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <TextField
                  size="small"
                  fullWidth
                  label={`Option ${i + 1}`}
                  value={option}
                  onChange={(e) => setOptions((opts) => opts.map((o, j) => (j === i ? e.target.value : o)))}
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                  required
                />
                <IconButton
                  aria-label="Remove option"
                  disabled={options.length <= 2}
                  onClick={() => setOptions((opts) => opts.filter((_, j) => j !== i))}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
            <Button
              startIcon={<AddIcon />}
              disabled={options.length >= MAX_OPTIONS}
              onClick={() => setOptions((opts) => [...opts, ''])}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add option
            </Button>

            <TextField
              label="Open until"
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />

            <div>
              <FormControlLabel
                control={
                  <Switch checked={displayAfterClosed} onChange={(e) => setDisplayAfterClosed(e.target.checked)} />
                }
                label="Hide results until the poll closes"
              />
              <FormHelperText>
                {displayAfterClosed
                  ? 'Voters see results only after the poll closes.'
                  : 'Voters see results right after they vote.'}
              </FormHelperText>
            </div>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
