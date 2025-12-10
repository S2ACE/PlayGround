import { Grid, Box, Card, CardContent, Typography, Button } from '@mui/material';
import { KeyboardArrowLeft } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vocabularyService, type Vocabulary } from '../../services/VocabularyService';
import type { JSX } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

interface WordGroup {
    startIndex: number;
    endIndex: number;
    wordCount: number;
    displayName: string;
    words: Vocabulary[];
    groupIndex: number;
}

const LetterSelection = (): JSX.Element => {
    const navigate = useNavigate();
    const { level } = useParams<{ level: string }>();
    const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await vocabularyService.getAllVocabulary('en');
                
                if (level) {
                    const groups = createWordGroups(data, level);
                    setWordGroups(groups);
                }
            } catch (error) {
                console.error('Failed to fetch vocabulary:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [level]);

    // Group words for a given level into chunks of 20 words, sorted alphabetically
    const createWordGroups = (data: Vocabulary[], currentLevel: string): WordGroup[] => {
        // 1. Filter by level and sort by first letter, then full word
        const levelWords = data
            .filter(word => word.level === currentLevel)
            .sort((a, b) => {
                const letterA = a.word.charAt(0).toLowerCase();
                const letterB = b.word.charAt(0).toLowerCase();
                
                if (letterA !== letterB) {
                    return letterA.localeCompare(letterB);
                }
                return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
            });

        console.log(`Level ${currentLevel} total words:`, levelWords.length);

        // 2. Split into groups of 20 words
        const groups: WordGroup[] = [];
        const groupSize = 20;

        for (let i = 0; i < levelWords.length; i += groupSize) {
            const startIndex = i;
            const endIndex = Math.min(i + groupSize - 1, levelWords.length - 1);
            const groupWords = levelWords.slice(startIndex, endIndex + 1);
            const groupIndex = Math.floor(i / groupSize) + 1;
            // Display name like "A-C" or "B" based on first/last word in group
            const displayName = createGroupDisplayName(groupWords);
            
            groups.push({
                startIndex,
                endIndex,
                wordCount: groupWords.length,
                displayName,
                words: groupWords,
                groupIndex
            });
        }

        console.log('Created groups:', groups.map(g => ({ 
            index: g.groupIndex,
            name: g.displayName, 
            count: g.wordCount
        })));

        return groups;
    };
    
    // Build label for a group, e.g. "A-C" or "B" if all words start with same letter
    const createGroupDisplayName = (words: Vocabulary[]): string => {
        if (words.length === 0) return '';

        const firstWord = words[0];
        const lastWord = words[words.length - 1];
        
        const firstLetter = firstWord.word.charAt(0).toUpperCase();
        const lastLetter = lastWord.word.charAt(0).toUpperCase();
        
        if (firstLetter === lastLetter) {
            return firstLetter;
        } else {
            return `${firstLetter}-${lastLetter}`;
        }
    };

    const handleGroupSelect = (group: WordGroup) => {
        navigate(`/vocabulary/level/${level}/words/${group.startIndex}-${group.endIndex}`);
    };

    const handleGoBack = () => {
        navigate('/vocabulary/level');
    };

    if (loading) {
        return <LoadingSpinner message="Loading word group" />;
    }

    return (
        <Box sx={{ maxWidth: 800, width: '100%', mx: 'auto', mt: { xs : 1, sm: 4 }, }}>
            <Box sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: { sm: 'center' },
                mb: 4,
                position: { sm: 'relative' },
            }}>
                <Button
                    onClick={handleGoBack}
                    startIcon={<KeyboardArrowLeft />}
                    sx={(theme) => ({
                        color: theme.palette.primary.main,
                        borderColor: theme.palette.primary.main,
                        border: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        position: { sm: 'absolute' },
                        left: 0,
                        mb: 1,
                        padding: {
                            xs: '2px 8px', 
                            sm: '4px 12px',
                        },
                        minWidth: { xs: 64, sm: 'auto' },
                        '& .MuiSvgIcon-root': {
                        fontSize: { xs: 18, sm: 24 },
                        },
                        '&:hover': {
                            backgroundColor: theme.palette.button.hover 
                        }
                    })}
                    aria-label="go back"
                >
                    Back
                </Button>
                
                <Typography 
                    variant="h4" 
                    sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                        textAlign: 'center' ,
                        width: '100%',
                    }}
                >
                    Level {level?.toUpperCase()} - Choose Word Group
                </Typography>
            </Box>
            
            <Grid container spacing={2}>
                {wordGroups.map((group, index) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`group-${index}`}>
                        <Card
                            sx={(theme) => ({
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    backgroundColor: theme.palette.primary.dark,
                                },
                                backgroundColor: theme.palette.primary.light,
                                minHeight: 120,
                                display: 'flex',
                                flexDirection: 'column',
                            })}
                            onClick={() => handleGroupSelect(group)}
                        >
                            <CardContent sx={{ 
                                textAlign: 'center', 
                                p: 2, 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center' 
                            }}>
                                <Typography variant="h4" 
                                    sx={{ 
                                        fontWeight: 'bold', 
                                        fontSize: { xs: '1.7rem', sm: '2.3rem' },
                                        color: '#000000',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {group.groupIndex}. {group.displayName}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#666666', mt: 1 }}>
                                    ({group.wordCount})
                                </Typography>
                            </CardContent>
                        </Card> 
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

};

export default LetterSelection;
