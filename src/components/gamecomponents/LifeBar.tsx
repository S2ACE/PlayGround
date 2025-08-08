import { Box } from "@mui/material";
import type { JSX } from 'react';
import filledHeartImg from "../../assets/filled_heart.png";
import emptyHeartImg from "../../assets/empty_heart.png";

export type LifeBarProps = {
  maxLives: number;
  livesLeft: number;
}

const LifeBar = ({ maxLives, livesLeft }: LifeBarProps): JSX.Element => {
 return (
        <Box display="flex" gap={1}>
        {Array.from({ length: maxLives }).map((_, index) => (
            <img
            key={index}
            src={index < livesLeft ? filledHeartImg : emptyHeartImg}
            alt="Heart"
            width={70}
            height={70}
            />
        ))}
        </Box>
    );
};

export default LifeBar;