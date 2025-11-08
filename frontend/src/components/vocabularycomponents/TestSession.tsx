import { useState, useEffect, type JSX } from 'react';
import { Box, Button, Typography, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WordCard from './WordCard';
import { getAllVocabulary, type Vocabulary } from '../../api/vocabularyApi';
import type { TestConfig, WordProgress, ProficiencyLevel } from './TestSetup';

// 新增 WordGroup 介面和相關函數
interface WordGroup {
    startIndex: number;
    endIndex: number;
    wordCount: number;
    displayName: string;
    words: Vocabulary[];
    groupIndex: number;
}

const TestSession = () : JSX.Element => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<TestConfig | null>(null);
    const [testWords, setTestWords] = useState<Vocabulary[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [progress, setProgress] = useState<WordProgress[]>([]);
    
    // 新增最愛狀態管理
    const [favorites, setFavorites] = useState<string[]>([]);

    // 載入最愛列表
    useEffect(() => {
        const savedFavorites = localStorage.getItem('favoriteWords');
        if (savedFavorites) {
            try {
                setFavorites(JSON.parse(savedFavorites));
            } catch (error) {
                console.error('Failed to parse favorites from localStorage:', error);
            }
        }
    }, []);

    // 保存最愛列表到 localStorage
    const saveFavoritesToStorage = (newFavorites: string[]) => {
        localStorage.setItem('favoriteWords', JSON.stringify(newFavorites));
        setFavorites(newFavorites);
    };

    // 處理最愛切換
    const handleFavoriteToggle = (wordId: string) => {
        console.log('Toggling favorite for word:', wordId); // 調試用
        console.log('Current favorites:', favorites); // 調試用
        
        if (favorites.includes(wordId)) {
            // 移除最愛
            const updatedFavorites = favorites.filter(id => id !== wordId);
            console.log('Removing from favorites, new list:', updatedFavorites); // 調試用
            saveFavoritesToStorage(updatedFavorites);
        } else {
            // 加入最愛
            const updatedFavorites = [...favorites, wordId];
            console.log('Adding to favorites, new list:', updatedFavorites); // 調試用
            saveFavoritesToStorage(updatedFavorites);
        }
    };

    // 新增 createWordGroups 函數（與 TestSetup.tsx 相同）
    const createWordGroups = (data: Vocabulary[], currentLevel: string): WordGroup[] => {
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

    useEffect(() => {
        const loadTestData = async () => {
            const savedConfig = localStorage.getItem('testConfig');
            if (!savedConfig) {
                navigate('/test/setup');
                return;
            }

            const testConfig: TestConfig = JSON.parse(savedConfig);
            setConfig(testConfig);

            const savedProgress = localStorage.getItem('wordProgress');
            const wordProgress: WordProgress[] = savedProgress ? JSON.parse(savedProgress) : [];
            setProgress(wordProgress);

            try {
                const vocabularyData = await getAllVocabulary('en');
                const filteredWords = filterWords(vocabularyData, testConfig, wordProgress);
                
                console.log('篩選後的單字數量:', filteredWords.length); // 調試用
                console.log('選中的groups:', testConfig.selectedGroups); // 調試用
                
                setTestWords(shuffleArray(filteredWords));
            } catch (error) {
                console.error('Failed to fetch vocabulary:', error);
                navigate('/test/setup');
            }
        };

        loadTestData();
    }, [navigate]);

    // 修改 filterWords 函數以支援 selectedGroups
    const filterWords = (
        words: Vocabulary[],
        config: TestConfig,
        progress: WordProgress[]
    ): Vocabulary[] => {
        let filtered = words;

        // 1. 首先根據等級篩選
        if (config.level) {
            filtered = filtered.filter(word => word.level === config.level);
        }

        // 2. 根據選中的 groups 篩選（這是關鍵步驟）
        if (config.selectedGroups && config.selectedGroups.length > 0) {
            // 重新建立 word groups 來找出選中的單字
            const groups = createWordGroups(filtered, config.level);
            const selectedWords = groups
                .filter(group => config.selectedGroups.includes(group.groupIndex))
                .flatMap(group => group.words);
            
            console.log('所有groups:', groups.map(g => ({ index: g.groupIndex, count: g.wordCount }))); // 調試用
            console.log('選中的groups單字:', selectedWords.length); // 調試用
            
            filtered = selectedWords;
        }

        // 3. 根據最愛篩選
        if (config.onlyFavorites) {
            const favoritesList = JSON.parse(localStorage.getItem('favoriteWords') || '[]');
            filtered = filtered.filter(word => favoritesList.includes(String(word.id || word.word)));
        }

        // 4. 根據熟練度篩選
        filtered = filtered.filter(word => {
            const wordProgress = progress.find(p => p.wordId === String(word.id || word.word));
            const currentProficiency = wordProgress?.currentProficiency || 'not_familiar';
            return config.proficiencyLevels.includes(currentProficiency);
        });

        return filtered;
    };

    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const handleCardFlip = () => {
        setIsFlipped(true);
    };

    const handleAnswer = (answer: ProficiencyLevel) => {
        if (hasAnswered) return;

        const currentWord = testWords[currentIndex];
        const wordId = String(currentWord.id || currentWord.word);

        const updatedProgress = updateWordProgress(progress, wordId, answer);
        setProgress(updatedProgress);

        localStorage.setItem('wordProgress', JSON.stringify(updatedProgress));

        setHasAnswered(true);

        setTimeout(() => {
            nextWord();
        }, 1500);
    };

    const updateWordProgress = (
        currentProgress: WordProgress[],
        wordId: string,
        answer: ProficiencyLevel
    ): WordProgress[] => {
        const existingIndex = currentProgress.findIndex(p => p.wordId === wordId);
        const now = new Date().toISOString();

        if (existingIndex >= 0) {
            const updated = [...currentProgress];
            const existing = updated[existingIndex];

            if (answer === 'mastered') {
                existing.masteredCount = Math.min(existing.masteredCount + 1, 3);
                if (existing.masteredCount >= 3) {
                    existing.currentProficiency = 'mastered';
                }
            } else {
                existing.masteredCount = 0;
                existing.currentProficiency = answer;
            }

            existing.lastTestDate = now;
            return updated;
        } else {
            const newProgress: WordProgress = {
                wordId,
                masteredCount: answer === 'mastered' ? 1 : 0,
                currentProficiency: answer,
                lastTestDate: now
            };
            return [...currentProgress, newProgress];
        }
    };

    const nextWord = () => {
        if (currentIndex < testWords.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
            setHasAnswered(false);
        } else {
            navigate('/test/results');
        }
    };

    const getProficiencyLabel = (level: ProficiencyLevel): string => {
        switch (level) {
            case 'mastered': return '記住了';
            case 'somewhat_familiar': return '不太熟';
            case 'not_familiar': return '不記得';
        }
    };

    const getProficiencyColor = (level: ProficiencyLevel): string => {
        switch (level) {
            case 'mastered': return '#4caf50';
            case 'somewhat_familiar': return '#ff9800';
            case 'not_familiar': return '#f44336';
        }
    };

    if (!config || testWords.length === 0) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '60vh' 
            }}>
                <Typography variant="h6">載入中...</Typography>
            </Box>
        );
    }

    const currentWord = testWords[currentIndex];
    const progressPercentage = ((currentIndex + 1) / testWords.length) * 100;
    
    // 檢查當前單字是否在最愛列表中
    const currentWordId = String(currentWord.id || currentWord.word);
    const isCurrentWordFavorite = favorites.includes(currentWordId);

    console.log('Current word ID:', currentWordId); // 調試用
    console.log('Is favorite:', isCurrentWordFavorite); // 調試用
    console.log('All favorites:', favorites); // 調試用

    return (
        <Box sx={{
            maxWidth: { xs: '100vw', sm: 600 },
            mx: 'auto',
            marginLeft: { xs: 'calc(50% - 50vw)', sm: 'auto' },
            marginRight: { xs: 'calc(50% - 50vw)', sm: 'auto' },
            width: { xs: '100vw', sm: '100%' },
            height: { xs: 'calc(100vh - 160px)', sm: 'auto' },
            p: { xs: 0, sm: 2 }
        }}>
            {/* 進度條 */}
            <Box sx={{ 
                mb: 2, 
                px: { xs: 2, sm: 0 },
                pt: { xs: 2, sm: 0 }
            }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 1 
                }}>
                    <Typography 
                        variant="body2"
                        sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                    >
                        {currentIndex + 1} / {testWords.length}
                    </Typography>
                    <Typography 
                        variant="body2"
                        sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                    >
                        {Math.round(progressPercentage)}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{ 
                        height: { xs: 6, sm: 8 }, 
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 152, 0, 0.2)',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: '#ff9800',
                        }
                    }}
                />
            </Box>

            {/* 單字卡片 - 修改為支援最愛功能 */}
            <Box sx={{ 
                mb: 3,
                px: { xs: 0, sm: 0 }
            }}>
                <WordCard
                    word={currentWord}
                    mode="test"
                    isFavorite={isCurrentWordFavorite}  // 傳遞當前單字的最愛狀態
                    onFavoriteToggle={handleFavoriteToggle}  // 傳遞最愛切換處理函數
                    onCardClick={!isFlipped ? handleCardFlip : undefined}
                    isFlipped={isFlipped}
                    hideControls={!isFlipped}  // 只在 flip 後顯示控制按鈕
                />
            </Box>

            {/* 答題選項 */}
            {isFlipped && (
                <Box sx={{
                    display: 'flex',
                    gap: { xs: 1, sm: 2 },
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    px: { xs: 2, sm: 0 },
                    pb: { xs: 2, sm: 0 }
                }}>
                    {(['mastered', 'somewhat_familiar', 'not_familiar'] as ProficiencyLevel[]).map(level => (
                        <Button
                            key={level}
                            variant="contained"
                            size={window.innerWidth < 600 ? "medium" : "large"}
                            disabled={hasAnswered}
                            onClick={() => handleAnswer(level)}
                            sx={{
                                backgroundColor: getProficiencyColor(level),
                                '&:hover': {
                                    backgroundColor: getProficiencyColor(level),
                                    opacity: 0.8
                                },
                                '&:disabled': {
                                    backgroundColor: '#ccc'
                                },
                                minWidth: { xs: 80, sm: 100 },
                                fontWeight: 'bold',
                                fontSize: { xs: '0.8rem', sm: '1rem' },
                                py: { xs: 1, sm: 1.5 }
                            }}
                        >
                            {getProficiencyLabel(level)}
                        </Button>
                    ))}
                </Box>
            )}

            {/* 提示文字 */}
            {!isFlipped && (
                <Typography
                    variant="body1"
                    sx={{
                        textAlign: 'center',
                        color: '#666',
                        fontStyle: 'italic',
                        px: { xs: 2, sm: 0 },
                        pb: { xs: 2, sm: 0 },
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                >
                    點擊卡片查看答案
                </Typography>
            )}
        </Box>
    );
};

export default TestSession;
