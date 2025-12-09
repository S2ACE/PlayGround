import { useState, useEffect, type JSX } from 'react';
import { Box, Button, Typography, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WordCard from './WordCard';
import { vocabularyService, type Vocabulary } from '../../services/VocabularyService';
import type { TestConfig, VocabularyProgress, ProficiencyLevel } from './TestSetup';
import { favouriteService } from '../../services/FavouriteService';
import { vocabularyProgressService } from '../../services/VocabularyProgressService';
import LoadingSpinner from '../common/LoadingSpinner';

interface VocabularyGroup {
    startIndex: number;
    endIndex: number;
    vocabularyCount: number;
    displayName: string;
    vocabularies: Vocabulary[];
    groupIndex: number;
}

const calculateProficiency = (masteredCount: number): ProficiencyLevel => {
    if (masteredCount >= 3) return 'mastered';
    if (masteredCount >= 1) return 'somewhat_familiar';
    return 'not_familiar';
};

const TestSession = (): JSX.Element => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<TestConfig | null>(null);
    const [testVocabularies, setTestVocabularies] = useState<Vocabulary[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [progress, setProgress] = useState<VocabularyProgress[]>([]);
    const [favourites, setFavourites] = useState<number[]>([]);
	const [isLoadVocabularies, setLoadVocabularies] = useState(false);
	const [isProgressLoaded, setIsProgressLoaded] = useState(false);

    // 載入收藏列表
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
    }, []);

    // 載入進度
    useEffect(() => {
        const loadProgress = async () => {
            try {
				console.log('loadProgress called at', new Date().toISOString());
                const savedProgress = await vocabularyProgressService.getProgress();
                const vocabularyProgress: VocabularyProgress[] = savedProgress.map(p => ({
                    vocabularyId: String(p.vocabularyId),
                    masteredCount: p.masteredCount,
                    currentProficiency: calculateProficiency(p.masteredCount),
                    lastTestDate: p.lastTestDate
                }));
                setProgress(vocabularyProgress);
                console.log('✅ 從 Service 載入進度:', vocabularyProgress.length);
				setIsProgressLoaded(true);
            } catch (error) {
                console.error('❌ 載入進度失敗:', error);
            }
        };
        loadProgress();
    }, []);

    // ✅ 載入 config
    useEffect(() => {
        const savedConfig = localStorage.getItem('testConfig');
        if (!savedConfig) {
            navigate('/test/setup');
            return;
        }
        setConfig(JSON.parse(savedConfig));
    }, [navigate]);

    // ✅ 載入單字 (只在 config 準備好時執行一次)
    useEffect(() => {
        if (!config) return;
		if (!isProgressLoaded) return;

		console.log(config);
        const loadVocabularies = async () => {
            try {
                const vocabularyData = await vocabularyService.getAllVocabulary('en');
                const filteredVocabularies = filterVocabularies(vocabularyData, config, progress);
                console.log('篩選後的單字數量:', filteredVocabularies.length);
                setTestVocabularies(shuffleArray(filteredVocabularies));
				setLoadVocabularies(true);
            } catch (error) {
                console.error('Failed to fetch vocabulary:', error);
                navigate('/test/setup');
            }
        };

        loadVocabularies();
    }, [config, isProgressLoaded, navigate]);

    const handleFavouriteToggle = async (vocabularyIdStr: string) => {
        const vocabularyId = Number(vocabularyIdStr);
        const currentIsFavourite = favourites.includes(vocabularyId);

        if (currentIsFavourite) {
            setFavourites(favourites.filter(id => id !== vocabularyId));
        } else {
            setFavourites([...favourites, vocabularyId]);
        }

        try {
            await favouriteService.toggleFavourite(vocabularyId, currentIsFavourite);
        } catch (error) {
            console.error('切換收藏失敗:', error);
            if (currentIsFavourite) {
                setFavourites([...favourites, vocabularyId]);
            } else {
                setFavourites(favourites.filter(id => id !== vocabularyId));
            }
        }
    };

    const createVocabularyGroups = (data: Vocabulary[], currentLevel: string): VocabularyGroup[] => {
        const levelVocabularies = data
            .filter(vocabulary => vocabulary.level === currentLevel)
            .sort((a, b) => {
                const letterA = a.word.charAt(0).toLowerCase();
                const letterB = b.word.charAt(0).toLowerCase();
                if (letterA !== letterB) {
                    return letterA.localeCompare(letterB);
                }
                return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
            });

        const groups: VocabularyGroup[] = [];
        const groupSize = 20;

        for (let i = 0; i < levelVocabularies.length; i += groupSize) {
            const startIndex = i;
            const endIndex = Math.min(i + groupSize - 1, levelVocabularies.length - 1);
            const groupVocabularies = levelVocabularies.slice(startIndex, endIndex + 1);
            const groupIndex = Math.floor(i / groupSize) + 1;

            const firstVocabulary = groupVocabularies[0];
            const lastVocabulary = groupVocabularies[groupVocabularies.length - 1];
            const firstLetter = firstVocabulary.word.charAt(0).toUpperCase();
            const lastLetter = lastVocabulary.word.charAt(0).toUpperCase();
            const displayName = firstLetter === lastLetter ? firstLetter : `${firstLetter}-${lastLetter}`;

            groups.push({
                startIndex,
                endIndex,
                vocabularyCount: groupVocabularies.length,
                displayName,
                vocabularies: groupVocabularies,
                groupIndex
            });
        }

        return groups;
    };

    const filterVocabularies = (
        vocabularies: Vocabulary[],
        config: TestConfig,
        progress: VocabularyProgress[]
    ): Vocabulary[] => {
        let filtered = vocabularies;

        if (config.level) {
            filtered = filtered.filter(vocabulary => vocabulary.level === config.level);
        }

        if (config.selectedGroups && config.selectedGroups.length > 0) {
            const groups = createVocabularyGroups(filtered, config.level);
            const selectedVocabularies = groups
                .filter(group => config.selectedGroups.includes(group.groupIndex))
                .flatMap(group => group.vocabularies);
            filtered = selectedVocabularies;
        }

        if (config.onlyFavourites) {
            filtered = filtered.filter(vocabulary => favourites.includes(Number(vocabulary.id)));
        }

        filtered = filtered.filter(vocabulary => {
            const vocabularyProgress = progress.find(p => p.vocabularyId === String(vocabulary.id));
            const currentProficiency = vocabularyProgress?.currentProficiency || 'not_familiar';
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

    const handleAnswer = async (answer: ProficiencyLevel) => {
        // ✅ 提前返回,防止重複執行
        if (hasAnswered) {
            console.log('⚠️ 已經回答過,忽略重複點擊');
            return;
        }

        console.log(`📝 開始處理答案: ${answer}`);

        // ✅ 立即設置為已回答
        setHasAnswered(true);

        const currentVocabulary = testVocabularies[currentIndex];
        const vocabularyId = String(currentVocabulary.id);
        const vocabularyIdNumber = Number(currentVocabulary.id);

        // 更新本地 state
        const updatedProgress = updateVocabularyProgress(progress, vocabularyId, answer);
        setProgress(updatedProgress);

        // 同步到 Service
        try {
            const vocabularyProgressItem = updatedProgress.find(p => p.vocabularyId === vocabularyId);
            if (vocabularyProgressItem) {
                await vocabularyProgressService.updateProgress({
                    vocabularyId: vocabularyIdNumber,
                    masteredCount: vocabularyProgressItem.masteredCount,
                    lastTestDate: vocabularyProgressItem.lastTestDate
                });
                console.log('✅ 進度已同步到 Service');
            }
        } catch (error) {
            console.error('❌ 同步進度失敗:', error);
        }

        nextVocabulary();

    };


    const updateVocabularyProgress = (
        currentProgress: VocabularyProgress[],
        vocabularyId: string,
        answer: ProficiencyLevel
    ): VocabularyProgress[] => {
        const existingIndex = currentProgress.findIndex(p => String(p.vocabularyId) === String(vocabularyId));
        const now = new Date().toISOString();

        if (existingIndex >= 0) {
            const updated = [...currentProgress];
            const existing = updated[existingIndex];
            let newMasteredCount = existing.masteredCount;

            if (answer === 'mastered') {
                newMasteredCount = Math.min(existing.masteredCount + 1, 3);
            } else if (answer === 'somewhat_familiar') {
                newMasteredCount = Math.max(existing.masteredCount - 1, 0);
            } else {
                newMasteredCount = 0;
            }

            existing.vocabularyId = String(vocabularyId);
            existing.masteredCount = newMasteredCount;
            existing.currentProficiency = calculateProficiency(newMasteredCount);
            existing.lastTestDate = now;

            console.log(`✅ 更新進度: ${vocabularyId}, masteredCount: ${newMasteredCount}, proficiency: ${existing.currentProficiency}`);
            return updated;
        } else {
            let initialMasteredCount = 0;

            if (answer === 'mastered') {
                initialMasteredCount = 1;
            } else if (answer === 'somewhat_familiar') {
                initialMasteredCount = 0;
            } else {
                initialMasteredCount = 0;
            }

            const newProgress: VocabularyProgress = {
                vocabularyId: String(vocabularyId),
                masteredCount: initialMasteredCount,
                currentProficiency: calculateProficiency(initialMasteredCount),
                lastTestDate: now
            };

            console.log(`✅ 新建進度: ${vocabularyId}, masteredCount: ${initialMasteredCount}, proficiency: ${newProgress.currentProficiency}`);
            return [...currentProgress, newProgress];
        }
    };

    const nextVocabulary = () => {
    if (currentIndex < testVocabularies.length - 1) {
        setCurrentIndex(prev => prev + 1);  // 仍然用函式更新
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
            case 'somewhat_familiar': return '#ED6C02';
            case 'not_familiar': return '#f44336';
        }
    };

    if (!config || !isLoadVocabularies) {
        return <LoadingSpinner message='Loading' />
    }

	if (testVocabularies.length === 0) {
		console.log(testVocabularies.length);
		return (
			<Box sx={{ p: { xs: 3, sm: 4 }, maxWidth: 800, mx: 'auto', textAlign: 'center' }}>
				<Typography
					variant="h5"
					sx={{
						mb: 2,
						fontWeight: 'bold',
						fontSize: { xs: '1.4rem', sm: '1.6rem' }
					}}
				>
					沒有符合條件的單字
				</Typography>

				<Typography
					variant="body1"
					sx={{
						mb: 4,
						fontSize: { xs: '0.95rem', sm: '1.05rem' }
					}}
				>
					可以調整等級、單字組、熟練度，或變更「只包括最愛」來放寬條件。
				</Typography>

				<Button
					variant="contained"
					onClick={() => navigate('/test/setup')}
					sx={theme => ({
						backgroundColor: theme.palette.primary.light,
						'&:hover': { backgroundColor: theme.palette.primary.dark },
						fontWeight: 'bold',
						fontSize: { xs: '1rem', sm: '1.1rem' },
						px: { xs: 3.5, sm: 4.5 },
						py: { xs: 1.4, sm: 1.6 },
						borderRadius: 2
					})}
				>
					返回測試設定
				</Button>
			</Box>
		);
	}


    const currentVocabulary = testVocabularies[currentIndex];
    const progressPercentage = ((currentIndex + 1) / testVocabularies.length) * 100;
    const isCurrentVocabularyFavourite = favourites.includes(Number(currentVocabulary.id));

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                        {currentIndex + 1} / {testVocabularies.length}
                    </Typography>
                    <Typography variant="body2">
                        {Math.round(progressPercentage)}%
                    </Typography>
                </Box>
                <LinearProgress variant="determinate" value={progressPercentage} />
            </Box>

            <WordCard
                word={currentVocabulary}
                mode="test"
                onCardClick={handleCardFlip}
                isFlipped={isFlipped}
                hideControls={true}
                isFavourite={isCurrentVocabularyFavourite}
                onFavouriteToggle={handleFavouriteToggle}
            />

            {isFlipped && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                    {(['mastered', 'somewhat_familiar', 'not_familiar'] as ProficiencyLevel[]).map(level => (
                        <Button
                            key={level}
                            variant="contained"
                            onClick={() => handleAnswer(level)}
                            disabled={hasAnswered}
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
            {/*
            {!isFlipped && (
                <Typography variant="body2" textAlign="center" sx={{ mt: 3, color: 'text.primary' }}>
                    點擊卡片查看答案
                </Typography>
            )}
            */}
        </Box>
    );
};

export default TestSession;