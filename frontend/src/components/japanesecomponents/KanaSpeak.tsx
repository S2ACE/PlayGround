import type { JSX } from 'react';
import { speakKanaSmart } from '../../utils';
import { IconButton, type SxProps, type Theme } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

type KanaSpeakProps = {
    char: string;
    sx?: SxProps<Theme>;
};

const KanaSpeak = ({ char, sx }: KanaSpeakProps): JSX.Element => {
    return (
        <>
            <IconButton
                onClick={e => {
                    e.stopPropagation();
                    speakKanaSmart(char);
                }}
                size="small"
                tabIndex={-1}
                aria-label="play sound"
                sx={{ ml: 1, color: '#8a580dff', ...sx }}
            >
                <VolumeUpIcon fontSize="inherit" />
            </IconButton>        
        </>   
    )
}
export default KanaSpeak;