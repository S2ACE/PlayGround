import { useState, useEffect, type JSX } from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/system';

type LoadingSpinnerProps = {
    message?: string;
    minHeight?: string;
    variant?: 'h4' | 'h5' | 'h6' | 'body1';
    sx?: SxProps<Theme>;
}

const LoadingSpinner = ({ 
    message = 'Loading',
    minHeight = '60vh',
    variant = 'h6',
    sx = {}
}: LoadingSpinnerProps): JSX.Element => {
    const [dotCount, setDotCount] = useState(3);

    useEffect(() => {
        const interval = setInterval(() => {
            setDotCount(prev => {
                if (prev >= 6) {
                    return 3;
                }
                return prev + 1;
            });
        }, 400);

        return () => clearInterval(interval);
    }, []);

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight,
                ...sx
            }}
        >
            <Typography variant={variant}>
                {message}{'.'.repeat(dotCount)}
            </Typography>
        </Box>
    );
};

export default LoadingSpinner;
