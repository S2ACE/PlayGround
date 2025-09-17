import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography } from '@mui/material';
import type { JSX } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import KanaCanvas from './KanaCanvas';
import KanaSpeak from './KanaSpeak';

interface KanaDialogProps {
  open: boolean;
  kana: string;
  romaji : string;
  onClose: () => void;
}

const KanaDialog = ({ open, kana, romaji, onClose }: KanaDialogProps): JSX.Element => (
  <Dialog 
    open={open} 
    onClose={(_, reason) => {
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
        return; // 阻止 backdrop 或 ESC 關閉
      }
      onClose();
    }}

  >
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body1" sx={{ fontSize : '1.2rem' }}>
          練寫：{kana} {romaji}
        </Typography>
        <KanaSpeak char={kana} />
      </Box>

      <Box sx={{ position: 'absolute', top: 8, right: 8, }}>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>

    </DialogTitle>
    <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <KanaCanvas kana={kana} />
    </DialogContent>
  </Dialog>
);

export default KanaDialog;