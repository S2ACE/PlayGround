import type { JSX } from 'react';
import { speakKana } from '../../utils';
import { IconButton } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const KanaSpeak = ( {char} : { char: string } ): JSX.Element => {
    return (
        <>
            <IconButton
                onClick={e => {
                e.stopPropagation();
                speakKana(char);
                }}
                size="small"
                tabIndex={-1}
                aria-label="play sound"
                sx={{ ml: 1 }}
            >
                <VolumeUpIcon fontSize="inherit" />
            </IconButton>        
        </>   
    )
}
export default KanaSpeak;