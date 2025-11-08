import { IconButton } from '@mui/material';
import type { JSX } from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useMediaQuery, useTheme } from '@mui/material';

type KanaNavigationProps = {
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
}: KanaNavigationProps): JSX.Element => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const getArrowPosition = () => {
    if (isMobile) {
      return {
        leftOffset: 10,
        rightOffset: 10,
        useAbsoluteCenter: false,
      };
    }
    if (isTablet) {
      return {
        leftOffset: 20,
        rightOffset: 20,
        useAbsoluteCenter: false,
      };
    }
    return {
      leftOffset: dialogWidth / 2 + offset,
      rightOffset: dialogWidth / 2 + offset,
      useAbsoluteCenter: true,
    };
  };
  const { leftOffset, rightOffset, useAbsoluteCenter } = getArrowPosition();

  return (
    <>
      {!isFirst && (
        <IconButton
          onClick={onPrev}
          sx={{
            position: 'fixed',
            top: '50%',
            left: useAbsoluteCenter 
              ? `calc(50% - ${leftOffset}px)` 
              : `${leftOffset}px`,
            transform: 'translateY(-50%)',
            zIndex: 1401,
            backgroundColor: 'white',
            boxShadow: 3,
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: '#f57c00',
            },
          }}
          size={isMobile ? 'medium' : 'large'}
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
            right: useAbsoluteCenter 
              ? `calc(50% - ${rightOffset}px)` 
              : `${rightOffset}px`,
            transform: 'translateY(-50%)',
            zIndex: 1401,
            backgroundColor: 'white',
            boxShadow: 3,
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: '#f57c00',
            },
          }}
          size={isMobile ? 'medium' : 'large'}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      )}
    </>
  );
};

export default KanaNavigation;