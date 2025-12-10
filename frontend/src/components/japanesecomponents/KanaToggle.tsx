import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { JSX } from 'react';

type KanaToggleProps = {
    kanaType: 'hiragana' | 'katakana';
    setKanaType: (type: 'hiragana' | 'katakana') => void;
}

const KanaToggle = ({ kanaType, setKanaType }: KanaToggleProps): JSX.Element => (
        <ToggleButtonGroup
            value={kanaType}
            exclusive
            onChange={(_, val) => val && setKanaType(val)}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: 'primary.light',
                borderRadius: '8px 8px 0 0',
                overflow: 'hidden',
                '.MuiToggleButton-root': {
                    flex: 1,
                    border: 'none',
                    borderRadius: 0,
                    color: '#000000',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    padding: '12px 16px',
                    backgroundColor: 'primary.light',
                '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: '#ffb74d',
                    color: '#000000',
                    borderBottom: '3px solid #000000',
                },
                '&:hover': {
                    backgroundColor: '#ffa726',
                },
                },
            }}
        >
        <ToggleButton value="hiragana">平假名</ToggleButton>
        <ToggleButton value="katakana">片假名</ToggleButton>
        </ToggleButtonGroup>


);

export default KanaToggle;