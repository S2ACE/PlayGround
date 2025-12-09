import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { memo, useRef, type JSX } from 'react';
import CloseIcon from '../../assets/x.png';
import ResetIcon from '../../assets/reset.png';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import KanaCanvas, { type KanaCanvasHandle } from './KanaCanvas';
import KanaSpeak from './KanaSpeak';

type KanaDialogProps = {
  open: boolean;
  kana: string;
  romaji: string;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const KanaDialog = ({
  open,
  kana,
  romaji,
  onClose,
  isFirst,
  isLast,
  onPrev,
  onNext,
}: KanaDialogProps): JSX.Element => {
  const canvasRef = useRef<KanaCanvasHandle | null>(null);

  const handleClose = (
    _event: object,
    reason: 'backdropClick' | 'escapeKeyDown',
  ) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }
    onClose();
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            maxWidth: 480,
            width: '100%',
            mx: { xs: 0, sm: 2 },
            position: 'relative',
          },
        },
      }}
    >
      {/* 右上角：Reset + Close */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          zIndex: 2,
        }}
      >
        <IconButton
          onClick={handleClear}
          aria-label="清除筆畫"
        >
          <Box
            component="img"
            src={ResetIcon}
            alt="clear"
            sx={(theme) => ({
              width: { xs: 26, sm: 28 },
              height: { xs: 26, sm: 28 },
              imageRendering: 'pixelated', 
              opacity: 0.75,
              '&:hover': {
                opacity: 1,
              },
              display: 'block',
              filter: theme.palette.mode === 'dark'
                ? 'invert(1)'
                : 'none',
            })}
          />
        </IconButton>
        <IconButton
          onClick={onClose}
          aria-label="關閉"
        >
          <Box
            component="img"
            src={CloseIcon}
            alt="close"
            sx={(theme) => ({
              width: { xs: 26, sm: 28 },
              height: { xs: 26, sm: 28 },
              imageRendering: 'pixelated', 
              display: 'block',
              filter: theme.palette.mode === 'dark'
                ? 'invert(1)'
                : 'none',
            })}
          />
        </IconButton>
      </Box>

      {/* 左右箭頭 */}
      {!isFirst && (
        <IconButton
          onClick={onPrev}
          aria-label="上一個假名"
          sx={(theme) => ({
            position: 'absolute',
            bottom: 1,
            left: 1,
            zIndex: 2,
            backgroundColor: 'primary.light',
            border: '2px solid',
            borderColor: theme.palette.wordGuess.buttonBorder,
            color: theme.palette.primary.contrastText,
            boxShadow: 3,
            width: { xs: 40, sm: 44 },
            height: { xs: 40, sm: 44 },
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          })}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
        </IconButton>
      )}

      {/* 右箭頭 */}
      {!isLast && (
        <IconButton
          onClick={onNext}
          aria-label="下一個假名"
          sx={(theme) => ({
            position: 'absolute',
            bottom: 1,
            right: 1,
            zIndex: 2,
            backgroundColor: 'primary.light',
            border: '2px solid',
            borderColor: theme.palette.wordGuess.buttonBorder,
            color: theme.palette.primary.contrastText,
            boxShadow: 3,
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          })}
        >
          <ArrowForwardIosIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
        </IconButton>
      )}

      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* 左邊：固定寬度的標題區 */}
        <Box
          sx={{
            width: { xs: 130, sm: 140 },
            flexShrink: 0,
          }}
        >
          <Typography
            variant="subtitle1"
            component="span"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.4rem' },
              whiteSpace: 'nowrap', 
            }}
          >
            練寫：{kana} {romaji}
          </Typography>
        </Box>

        {/* 右邊：KanaSpeak，位置穩定 */}
        <Box
          sx={{
            ml: 1,
            flexShrink: 0,
          }}
        >
          <KanaSpeak
            char={kana}
            sx={{
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '1.7rem' },
            }}
          />
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          justifyContent: 'center',
          overflowX: 'auto',
        }}
      >
        <Box
          sx={{
            width: 300,
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <KanaCanvas ref={canvasRef} kana={kana} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default memo(KanaDialog);