import { Box } from "@mui/material";
import type { JSX } from 'react';
import filledHeartImg from "../../assets/filled_heart.png";
import emptyHeartImg from "../../assets/empty_heart.png";
import { useMemo, memo } from 'react';

export type LifeBarProps = {
  maxLives: number;
  livesLeft: number;
}


const LifeBar = memo(({ maxLives, livesLeft }: LifeBarProps): JSX.Element => {

    const hearts = useMemo(() => {
        return Array.from({ length: maxLives }).map((_, index) => ({
            id: index,
            isFilled: index < livesLeft
        }));
    }, [maxLives, livesLeft]);

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={1}
      justifyContent="flex-start"
    >
      {hearts.map(({ id, isFilled }) => (
          <Box
              key={id}
              component="img"
              src={isFilled ? filledHeartImg : emptyHeartImg}
              alt="Heart"
              sx={{
                  width: { xs: '31px', sm: '41px' },
                  height: { xs: '28px', sm: '38px'}
              }}
          />
      ))}
    </Box>
  );
});

LifeBar.displayName = 'LifeBar';
export default LifeBar;