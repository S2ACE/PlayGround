import { Grid, Box, Card, CardContent, Typography, Button } from '@mui/material';
import { KeyboardArrowLeft } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vocabularyService, type Vocabulary } from '../../services/VocabularyService';
import type { JSX } from 'react';

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

    // 核心功能：創建 20 個單字的分組
    const createWordGroups = (data: Vocabulary[], currentLevel: string): WordGroup[] => {
        // 1. 先獲取該等級的所有單字並按字母排序
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

        // 2. 按每 20 個單字分組
        const groups: WordGroup[] = [];
        const groupSize = 20;

        for (let i = 0; i < levelWords.length; i += groupSize) {
            const startIndex = i;
            const endIndex = Math.min(i + groupSize - 1, levelWords.length - 1);
            const groupWords = levelWords.slice(startIndex, endIndex + 1);
            const groupIndex = Math.floor(i / groupSize) + 1;
            
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
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Typography variant="h6">Loading words...</Typography>
            </Box>
        );
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
                    sx={{
                        color: '#ff9800',
                        textTransform: 'none',
                        position: { sm: 'absolute' },
                        left: { xs: 0, sm: 0 },
                        mb: { xs: 1, sm: 0 },
                        minWidth: 'auto',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        }
                    }}
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
                            sx={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    backgroundColor: '#e65100',
                                },
                                backgroundColor: '#ff9800',
                                minHeight: 120,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
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
