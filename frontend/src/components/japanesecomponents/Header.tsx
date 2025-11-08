import type { JSX } from 'react';
import { Typography }  from '@mui/material';

const Header = ( {title} : {title? : string}): JSX.Element => {
    switch(title){
        case 'seion':
            title = '清音';
            break;
        case 'dakuon&handakuon':
            title = '濁音和半濁音';
            break;
        case 'youon':
            title = '拗音';
            break;
        default:
            title = "五十音表";
    }
    return (
        <>
            <Typography 
                variant="h1" 
                component="h1" 
                sx={{             
                    fontWeight: 'bold', 
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } 
                }}
            >
                {title}
            </Typography>
        </>
    );
};

export default Header;