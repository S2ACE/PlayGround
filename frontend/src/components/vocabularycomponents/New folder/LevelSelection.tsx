import { Grid, Box, Card, CardContent, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllVocabulary, getAllLevels, type Vocabulary } from '../../../api/vocabularyApi';
import type { JSX } from 'react';
import LoadingSpinner from '../../common/LoadingSpinner';


const LevelSelection = (): JSX.Element => {
    const navigate = useNavigate();
    const [levels, setLevels] = useState<string[]>([]);
    const [vocabularyData, setVocabularyData] = useState<Vocabulary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
              setLoading(true);
              const data = await getAllVocabulary('en');
              setVocabularyData(data);
              const availableLevels = getAllLevels(data);
              setLevels(availableLevels);
              setLoading(false);
            } catch (error) {
              console.error('Failed to fetch vocabulary:', error);
            }
    };

    fetchData();
  }, []);

    const handleLevelSelect = (level: string) => {
      navigate(`/vocabulary/level/${level}`);
    };

  const getWordCountForLevel = (level: string): number => {
    return vocabularyData.filter(word => word.level === level).length;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

    return (
    <Box sx={{ maxWidth: 600, width: '100%', mx: 'auto', my: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            textAlign: 'center', 
            mb: 4, 
            fontWeight: 'bold', 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } 
            }}
          >
        Choose Your Level
        </Typography>
        
        <Grid container spacing={3}>
            {levels.map((level) => (
                <Grid size={{ xs: 6, sm: 4 }} key={level}>
                <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                          transform: 'translateY(-4px)',
                          backgroundColor: '#e65100',
                      },
                      backgroundColor: '#ff9800',                  
                    }}
                    onClick={() => handleLevelSelect(level)}
                >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#000000', textTransform: 'uppercase'}}>
                        {level}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666666', mt: 1 }}>
                        {getWordCountForLevel(level)} words
                    </Typography>
                    </CardContent>
                </Card>
                </Grid>
            ))}
        </Grid>
    </Box>
    );
};

export default LevelSelection;
