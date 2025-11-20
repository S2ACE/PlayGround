// WordLearning.tsx
import { Box, Typography, Button, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { KeyboardArrowLeft } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllVocabulary, type Vocabulary } from '../../api/vocabularyApi';
import WordCard from './WordCard';
import type { JSX } from 'react';
import { favouriteService } from '../../services/FavouriteService';
import { useAuth } from '../../contexts/AuthContext';

const WordLearning = (): JSX.Element => {
    const { level, range } = useParams<{ level: string; range: string }>();
    const navigate = useNavigate();

    const [words, setWords] = useState<Vocabulary[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [favourites, setFavourites] = useState<number[]>([]);
    const { user } = useAuth();

    // 載入最愛列表
    useEffect(() => {
        const loadFavourites = async () => {
            try {
                const favouriteIds = await favouriteService.getFavouriteIds();
                setFavourites(favouriteIds);
            } catch (error) {
                console.error('載入收藏列表失敗:', error);
            }
        };
        loadFavourites();
    }, [user]);

    // ✅ 處理最愛切換 (修正變數命名)
    const handleFavouriteToggle = useCallback(async (vocabularyIdStr: string) => {
        const vocabularyId = Number(vocabularyIdStr);
        const currentIsFavourite = favourites.includes(vocabularyId);

        console.log('Toggling favourite for vocabulary:', vocabularyId);

        // 樂觀更新 UI
        if (currentIsFavourite) {
            setFavourites(favourites.filter(id => id !== vocabularyId));
        } else {
            setFavourites([...favourites, vocabularyId]);
        }

        try {
            // 呼叫 FavouriteService (含 Debounce)
            await favouriteService.toggleFavourite(vocabularyId, currentIsFavourite);
        } catch (error) {
            console.error('切換收藏失敗:', error);
            // 失敗時回滾 UI
            if (currentIsFavourite) {
                setFavourites([...favourites, vocabularyId]);
            } else {
                setFavourites(favourites.filter(id => id !== vocabularyId));
            }
        }
    }, [favourites]);

    useEffect(() => {
        const fetchWords = async () => {
            try {
                setLoading(true);
                const allWords = await getAllVocabulary('en');
                
                if (level && range) {
                    const [startStr, endStr] = range.split('-');
                    const startIndex = parseInt(startStr);
                    const endIndex = parseInt(endStr);
                    
                    const levelWords = allWords
                        .filter(word => word.level === level)
                        .sort((a, b) => {
                            const letterA = a.word.charAt(0).toLowerCase();
                            const letterB = b.word.charAt(0).toLowerCase();
                            
                            if (letterA !== letterB) {
                                return letterA.localeCompare(letterB);
                            }
                            return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
                        });

                    const selectedWords = levelWords.slice(startIndex, endIndex + 1);
                    
                    console.log(`Loading words ${startIndex}-${endIndex}:`, selectedWords.map(w => w.word));
                    setWords(selectedWords);
                }
            } catch (error) {
                console.error('Failed to fetch words:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWords();
        setCurrentIndex(0);
    }, [level, range]);

    const handleNext = useCallback(() => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex, words.length]);

    const handlePrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    }, [currentIndex]);

    const handleHome = () => {
        navigate('/vocabulary/level');
    };

    const handleGoBack = () => {
        navigate(`/vocabulary/level/${level}`);
    };

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowLeft':
                    handlePrevious();
                    break;
                case 'ArrowRight':
                    handleNext();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleNext, handlePrevious]);

    // 在單字切換時自動滾動到底部
    useEffect(() => {
        // 只在手機版時執行
        if (window.innerWidth <= 600) {
            // 延遲一點執行,確保 WordCard 已經渲染完成
            setTimeout(() => {
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [currentIndex]);

    const getGroupDisplayName = (): string => {
        if (!range) return '';
        const [startStr] = range.split('-');
        const startIndex = parseInt(startStr);
        const groupIndex = Math.floor(startIndex / 20) + 1;
        return `Group ${groupIndex}`;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Typography variant="h6">Loading words...</Typography>
            </Box>
        );
    }

    if (words.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Typography variant="h6">
                    No words found for range {range} in Level {level}
                </Typography>
            </Box>
        );
    }

    // ✅ 修正變數命名: currentWord -> currentVocabulary
    const currentVocabulary = words[currentIndex];
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === words.length - 1;
    
    // ✅ 檢查當前單字是否在最愛列表中
    const isFavourite = favourites.includes(Number(currentVocabulary.id));

    return (
        <Box>
            <Box sx={{ 
                maxWidth: 800, 
                width: '100%', 
                mx: 'auto', 
                mt: { xs : 1, sm: 4 },
                mb: 1
            }}>
                <Box sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: { sm: 'center' },
                    position: { sm: 'relative' },
                }}>
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        position: { sm: 'absolute' },
                        left: { xs: 0, sm: 0 },
                        mb: { xs: 1, sm: 0 },
                    }}>
                        <IconButton 
                            onClick={handleHome}
                            sx={{
                                color: '#ff9800',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                }
                            }}
                        >
                            <HomeIcon />
                        </IconButton>
                        <Button
                            onClick={handleGoBack}
                            startIcon={<KeyboardArrowLeft />}
                            sx={{
                                color: '#ff9800',
                                textTransform: 'none',
                                minWidth: 'auto',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                }
                            }}
                            aria-label="go back"
                        >
                            Back
                        </Button>
                    </Box>
                    
                    <Box sx={{ 
                        textAlign: 'center',
                        width: '100%',
                    }}>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 'bold',
                                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                            }}
                        >
                            Level {level?.toUpperCase()} - {getGroupDisplayName()}
                        </Typography>
                        <Typography 
                            variant="body2"
                            sx={{
                                color: '#666666',
                                fontSize: { xs: '0.9rem', sm: '0.925rem' },
                                mt: 1
                            }}
                        >
                            {currentIndex + 1}/{words.length}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* 單字卡片 - 固定高度版本 */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                p: { xs: 0, sm: 2 },
                pb: { xs: 0, sm: 4 },
                maxWidth: { xs: '100vw', sm: '600px' },
                mx: 'auto',
                marginLeft: { xs: 'calc(50% - 50vw)', sm: 'auto' },
                marginRight: { xs: 'calc(50% - 50vw)', sm: 'auto' },
                width: { xs: '100vw', sm: '100%' },
                height: { xs: 'calc(100vh - 160px)', sm: 'auto' },
            }}>
                <WordCard 
                    word={currentVocabulary}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    showPrevious={!isFirst}
                    showNext={!isLast}
                    isFavourite={isFavourite}
                    onFavouriteToggle={handleFavouriteToggle}
                />
            </Box>
        </Box>
    );
};

export default WordLearning;