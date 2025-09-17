import { IconButton } from '@mui/material';
import type { JSX } from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface KanaNavigationProps {
    isFirst: boolean;
    isLast: boolean;
    onPrev: () => void;
    onNext: () => void;
    dialogWidth?: number;
    offset?: number;
}

const KanaNavigation = ({
    isFirst,
    isLast,
    onPrev,
    onNext,
    dialogWidth = 400,
    offset = 30,
}: KanaNavigationProps): JSX.Element => (
  <>
    {!isFirst && (
      <IconButton
        onClick={onPrev}
        sx={{
          position: 'fixed',
          top: '50%',
          left: `calc(50% - ${dialogWidth / 2 + offset}px)`,
          transform: 'translateY(-50%)',
          zIndex: 1401,
          bgcolor: 'white',
          boxShadow: 3,
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: '#f57c00',
          },
        }}
        size="large"
      >
        <ArrowBackIosNewIcon />
      </IconButton>
    )}
    {!isLast && (
      <IconButton
        onClick={onNext}
        sx={{
          position: 'fixed',
          top: '50%',
          left: `calc(50% + ${dialogWidth / 2 + offset - 48}px)`,
          transform: 'translateY(-50%)',
          zIndex: 1401,
          bgcolor: 'white',
          boxShadow: 3,
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: '#f57c00',
          },
        }}
        size="large"
      >
        <ArrowForwardIosIcon />
      </IconButton>
    )}
  </>
);

export default KanaNavigation;