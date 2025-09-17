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
    <Box
      display="flex"
      flexWrap="wrap"
      gap={1}
      justifyContent="flex-start"
    >
    {Array.from({ length: maxLives }).map((_, index) => (
        <img
          key={index}
          src={index < livesLeft ? filledHeartImg : emptyHeartImg}
          alt="Heart"
          style={{ width: '60px', height: '60px' }}
        />
    ))}
    </Box>
  );
};

export default LifeBar;