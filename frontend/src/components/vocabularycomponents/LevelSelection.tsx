import { Grid, Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vocabularyService, type Vocabulary } from '../../services/VocabularyService';
import type { JSX } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

const LevelSelection = (): JSX.Element => {
    const navigate = useNavigate();
    const [levels, setLevels] = useState<string[]>([]);
    const [vocabularyData, setVocabularyData] = useState<Vocabulary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await vocabularyService.getAllVocabulary('en');
                setVocabularyData(data);
                const availableLevels = vocabularyService.getAllLevels(data);
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

    const handleTestMode = () => {
        navigate('/test/setup');
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

            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleTestMode}
                    sx={(theme) => ({
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                        '&:hover': { backgroundColor: '#e65100' },
                        py: { xs: 1.5, sm: 2 },
                        px: { xs: 3, sm: 4 },
                        fontSize: { xs: '1rem', sm: '1.2rem' },
                        fontWeight: 'bold',
                        borderRadius: 3
                    })}
                >
                    🧠 開始測試模式
                </Button>
            </Box>

            <Grid container spacing={3}>
              {levels.map((level) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={level}>
                  <Card
                      sx={(theme) => ({
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            backgroundColor: theme.palette.primary.dark,
                        },
                        backgroundColor: theme.palette.primary.light,                  
                      })}
                      onClick={() => handleLevelSelect(level)}
                  >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="h3" sx={(theme) => ({ fontWeight: 'bold', color: theme.palette.primary.contrastText, textTransform: 'uppercase'})}>
                          {level}
                      </Typography>
                      <Typography variant="body2" sx={(theme) => ({ color: theme.palette.share.prompt, mt: 1 })}>
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
