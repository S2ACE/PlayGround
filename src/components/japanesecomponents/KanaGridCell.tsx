import { Grid, Typography, Box } from '@mui/material';
import type { JSX } from 'react';
import KanaSpeak from './KanaSpeak';

type KanaGridCellProps = {
    char: string;
    romaji: string;
    onClick: () => void;
    gridColumns?: number;
    isInteractive: boolean;
}

const KanaGridCell = ({ char, romaji, onClick, gridColumns = 5, isInteractive }: KanaGridCellProps): JSX.Element => {
  const hasKana = !!char;

  return (
    <Grid
      size={{ xs: 1 }}
      sx={{
        textAlign: 'center',
        border: '1px solid #ccc',
        minHeight: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff9800',
        color: '#000000',
        cursor: hasKana ? 'pointer' : 'default',
        opacity: hasKana ? 1 : 0.5,
        p: 0,
        transition: 'background 0.2s',
        minWidth: gridColumns === 3 ? '33.333%' : 'auto',
        ...(hasKana && {
          '&:hover': {
            backgroundColor: '#e65100',
          },
        }),
      }}
      onClick={hasKana && isInteractive ? onClick : undefined}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          px: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4" sx={{ userSelect: 'none', lineHeight: 1 }}>
            {char}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#212121',
              userSelect: 'none',
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            {romaji}
          </Typography>
        </Box>
          {hasKana && (
            <KanaSpeak char={char} />
          )}
        </Box>
    </Grid>
  );
};

export default KanaGridCell;