// TestResults.tsx - 自動判斷 localStorage 或 Database
import { useEffect, useState, type JSX } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { VocabularyProgress, ProficiencyLevel } from './TestSetup';
import { vocabularyProgressService, getCurrentProficiency } from '../../services/VocabularyProgressService';

const TestResults = (): JSX.Element => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        mastered: 0,
        somewhat_familiar: 0,
        not_familiar: 0,
        total: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    // ✅ 使用 VocabularyProgressService 載入進度
    useEffect(() => {
        const loadProgress = async () => {
            try {
                setIsLoading(true);
                
                // ✅ 從 Service 讀取 (自動判斷 localStorage 或 database)
                const savedProgress = await vocabularyProgressService.getProgress();
                
                // ✅ 轉換為 VocabularyProgress 格式並計算 currentProficiency
                const progress: VocabularyProgress[] = savedProgress.map(p => ({
                    vocabularyId: String(p.vocabularyId),
                    masteredCount: p.masteredCount,
                    currentProficiency: getCurrentProficiency(p.masteredCount),
                    lastTestDate: p.lastTestDate
                }));

                // ✅ 統計各個等級的數量
                const masteredCount = progress.filter(p => p.currentProficiency === 'mastered').length;
                const somewhatCount = progress.filter(p => p.currentProficiency === 'somewhat_familiar').length;
                const notFamiliarCount = progress.filter(p => p.currentProficiency === 'not_familiar').length;

                setStats({
                    mastered: masteredCount,
                    somewhat_familiar: somewhatCount,
                    not_familiar: notFamiliarCount,
                    total: progress.length
                });

                console.log('✅ 測試結果已載入:', {
                    mastered: masteredCount,
                    somewhat_familiar: somewhatCount,
                    not_familiar: notFamiliarCount,
                    total: progress.length
                });
            } catch (error) {
                console.error('❌ 載入測試結果失敗:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProgress();
    }, []);

    const getProficiencyLabel = (level: ProficiencyLevel): string => {
        switch (level) {
            case 'mastered': return '熟記';
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

    // ✅ 載入中顯示
    if (isLoading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
            }}>
                <Typography>載入中...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            maxWidth: { xs: '100%', sm: 600 },
            width: '100%',
            mx: 'auto',
            mt: { xs: 1, sm: 4 },
            p: { xs: 2, sm: 3 }
        }}>
            <Typography 
                variant="h4" 
                sx={{ 
                    mb: 4, 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                }}
            >
                測試完成！
            </Typography>

            <Card sx={{
                mb: 3,
                backgroundColor: '#ff9800',
                '&:hover': {
                    backgroundColor: '#e65100',
                }
            }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            mb: 3, 
                            textAlign: 'center',
                            color: '#000000',
                            fontWeight: 'bold',
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        您的學習進度
                    </Typography>

                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2 
                    }}>
                        {(['mastered', 'somewhat_familiar', 'not_familiar'] as ProficiencyLevel[]).map(level => (
                            <Box 
                                key={level} 
                                sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 1, sm: 0 }
                                }}
                            >
                                <Chip
                                    label={getProficiencyLabel(level)}
                                    sx={{
                                        backgroundColor: getProficiencyColor(level),
                                        color: 'white',
                                        fontWeight: 'bold',
                                        minWidth: { xs: 120, sm: 80 },
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                    }}
                                />
                                <Typography 
                                    variant="h6" 
                                    fontWeight="bold"
                                    sx={{
                                        color: '#000000',
                                        fontSize: { xs: '1rem', sm: '1.25rem' }
                                    }}
                                >
                                    {stats[level]} 個單字
                                </Typography>
                            </Box>
                        ))}

                        <Divider sx={{ my: 1, backgroundColor: '#000000' }} />

                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 1, sm: 0 }
                        }}>
                            <Typography 
                                variant="h6" 
                                fontWeight="bold"
                                sx={{
                                    color: '#000000',
                                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                }}
                            >
                                總計
                            </Typography>
                            <Typography 
                                variant="h6" 
                                fontWeight="bold"
                                sx={{
                                    color: '#000000',
                                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                }}
                            >
                                {stats.total} 個單字
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: 'column' 
            }}>
                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => navigate('/test/setup')}
                    sx={{
                        backgroundColor: '#ff9800',
                        '&:hover': { backgroundColor: '#e65100' },
                        py: { xs: 1.5, sm: 2 },
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', sm: '1.1rem' }
                    }}
                >
                    再次測試
                </Button>

                <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    onClick={() => navigate('/vocabulary/level')}
                    sx={{
                        borderColor: '#ff9800',
                        color: '#ff9800',
                        '&:hover': { 
                            borderColor: '#e65100', 
                            color: '#e65100',
                            backgroundColor: 'rgba(255, 152, 0, 0.1)'
                        },
                        py: { xs: 1.5, sm: 2 },
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', sm: '1.1rem' }
                    }}
                >
                    返回首頁
                </Button>
            </Box>
        </Box>
    );
};

export default TestResults;
