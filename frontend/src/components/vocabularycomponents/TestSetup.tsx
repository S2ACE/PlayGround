import React, { useState, useEffect, useCallback, type JSX } from 'react';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Button,
    Card,
    CardContent,
    Chip,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import { KeyboardArrowLeft } from '@mui/icons-material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useNavigate } from 'react-router-dom';
import { getAllVocabulary, getAllLevels, type Vocabulary } from '../../api/vocabularyApi';

export type ProficiencyLevel = 'mastered' | 'somewhat_familiar' | 'not_familiar';

interface WordGroup {
    startIndex: number;
    endIndex: number;
    wordCount: number;
    displayName: string;
    words: Vocabulary[];
    groupIndex: number;
}

export interface TestConfig {
    level: string;
    selectedGroups: number[];
    onlyFavorites: boolean;
    proficiencyLevels: ProficiencyLevel[];
}

export interface WordProgress {
    wordId: string;
    masteredCount: number;
    currentProficiency: ProficiencyLevel;
    lastTestDate: string;
}

const TestSetup = () : JSX.Element => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<TestConfig>({
        level: '',
        selectedGroups: [],
        onlyFavorites: false,
        proficiencyLevels: ['mastered', 'somewhat_familiar', 'not_familiar']
    });

    const [levels, setLevels] = useState<string[]>([]);
    const [vocabularyData, setVocabularyData] = useState<Vocabulary[]>([]);
    const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
    const [loading, setLoading] = useState(true);

    // 創建 word groups 的邏輯
    const createWordGroups = useCallback((data: Vocabulary[], currentLevel: string): WordGroup[] => {
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
    }, []);

    const createGroupDisplayName = useCallback((words: Vocabulary[]): string => {
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
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getAllVocabulary('en');
                setVocabularyData(data);
                const availableLevels = getAllLevels(data);
                setLevels(availableLevels);
            } catch (error) {
                console.error('Failed to fetch vocabulary:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (config.level && vocabularyData.length > 0) {
            const groups = createWordGroups(vocabularyData, config.level);
            setWordGroups(groups);
            setConfig(prev => ({ ...prev, selectedGroups: [] }));
        } else {
            setWordGroups([]);
        }
    }, [config.level, vocabularyData, createWordGroups]);

    // 優化的事件處理函數 - 使用 React.startTransition 來標記非緊急更新
    const handleLevelChange = useCallback((level: string) => {
        // 立即更新 UI
        setConfig(prev => ({ 
            ...prev, 
            level,
            selectedGroups: []
        }));
    }, []);

    const handleGroupToggle = useCallback((groupIndex: number) => {
        // 立即更新，不使用 startTransition 因為這是用戶直接互動
        setConfig(prev => ({
            ...prev,
            selectedGroups: prev.selectedGroups.includes(groupIndex)
                ? prev.selectedGroups.filter(g => g !== groupIndex)
                : [...prev.selectedGroups, groupIndex]
        }));
    }, []);

    const handleSelectAllGroups = useCallback(() => {
        const allGroupIndices = wordGroups.map(g => g.groupIndex);
        setConfig(prev => ({
            ...prev,
            selectedGroups: prev.selectedGroups.length === allGroupIndices.length 
                ? [] 
                : allGroupIndices
        }));
    }, [wordGroups]);

    const handleProficiencyChange = useCallback((level: ProficiencyLevel, checked: boolean) => {
        if (checked) {
            setConfig(prev => ({
                ...prev,
                proficiencyLevels: [...prev.proficiencyLevels, level]
            }));
        } else {
            setConfig(prev => ({
                ...prev,
                proficiencyLevels: prev.proficiencyLevels.filter(l => l !== level)
            }));
        }
    }, []);

    const handleFavoriteToggle = useCallback((checked: boolean) => {
        setConfig(prev => ({ ...prev, onlyFavorites: checked }));
    }, []);

    const getProficiencyLabel = useCallback((level: ProficiencyLevel): string => {
        switch (level) {
            case 'mastered': return '熟記';
            case 'somewhat_familiar': return '不太熟';
            case 'not_familiar': return '不記得';
        }
    }, []);

    const getProficiencyColor = useCallback((level: ProficiencyLevel): string => {
        switch (level) {
            case 'mastered': return '#4caf50';
            case 'somewhat_familiar': return '#ff9800';
            case 'not_familiar': return '#f44336';
        }
    }, []);

    const getTotalSelectedWords = useCallback((): number => {
        return wordGroups
            .filter(group => config.selectedGroups.includes(group.groupIndex))
            .reduce((total, group) => total + group.wordCount, 0);
    }, [wordGroups, config.selectedGroups]);

    const handleStartTest = useCallback(() => {
        if (!config.level) {
            alert('請選擇等級');
            return;
        }
        if (config.selectedGroups.length === 0) {
            alert('請至少選擇一個單字組');
            return;
        }
        if (config.proficiencyLevels.length === 0) {
            alert('請至少選擇一個熟練度選項');
            return;
        }

        localStorage.setItem('testConfig', JSON.stringify(config));
        navigate('/test/session');
    }, [config, navigate]);

    const handleGoBack = useCallback(() => {
        navigate('/vocabulary/level');
    }, [navigate]);

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '60vh' 
            }}>
                <Typography variant="h6">Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 600, width: '100%', mx: 'auto', mt: { xs: 1, sm: 4 }, px: 2 }}>
            {/* 標題區域 */}
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
                        // 完全移除所有 transition 和動畫
                        transition: 'none',
                        animation: 'none',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            transition: 'none',
                        },
                        '&:active': {
                            backgroundColor: 'rgba(255, 152, 0, 0.2)',
                            transform: 'scale(0.95)',
                        },
                        // 禁用所有 Material-UI 的內建動畫
                        '&.MuiButtonBase-root': {
                            transition: 'none',
                        }
                    }}
                    disableRipple={true}
                    disableFocusRipple={true}
                    disableTouchRipple={true}
                    aria-label="go back"
                >
                    Back
                </Button>
                
                <Typography 
                    variant="h4" 
                    sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                        textAlign: 'center',
                        width: '100%',
                    }}
                >
                    測試設置
                </Typography>
            </Box>

            {/* 選擇等級 */}
            <Card sx={{ 
                mb: 3,
                backgroundColor: '#ff9800',
                // 完全禁用所有動畫和過渡效果
                transition: 'none',
                animation: 'none',
                transform: 'none',
            }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            mb: 2, 
                            color: '#000000',
                            fontWeight: 'bold',
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        選擇等級
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel 
                            sx={{ 
                                color: '#000000',
                                '&.Mui-focused': { color: '#000000' }
                            }}
                        >
                            等級
                        </InputLabel>
                        <Select
                            value={config.level}
                            label="等級"
                            onChange={(e) => handleLevelChange(e.target.value)}
                            sx={{
                                backgroundColor: 'white',
                                transition: 'none',  // 完全移除 transition
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#000000',
                                    transition: 'none',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#000000',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#000000',
                                },
                                // 禁用所有 Material-UI Select 的內建動畫
                                '& .MuiSelect-select': {
                                    transition: 'none',
                                }
                            }}
                            MenuProps={{
                                slotProps: {
                                    paper: {
                                        sx: {
                                            '& .MuiMenuItem-root': {
                                                transition: 'none',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                                }
                                            }
                                        }
                                    }
                                },
                                transitionDuration: 0,
                            }}
                        >
                            {levels.map(level => (
                                <MenuItem key={level} value={level}>
                                    {level.toUpperCase()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </CardContent>
            </Card>

            {/* 選擇單字組 */}
            {config.level && wordGroups.length > 0 && (
                <Card sx={{ 
                    mb: 3,
                    backgroundColor: '#ff9800',
                    transition: 'none',
                    animation: 'none',
                }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 2 
                        }}>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    color: '#000000',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                }}
                            >
                                選擇單字組 {config.selectedGroups.length > 0 && `(已選 ${getTotalSelectedWords()} 個單字)`}
                            </Typography>
                            <Button
                                size="small"
                                onClick={handleSelectAllGroups}
                                sx={{
                                    color: '#000000',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    transition: 'none',  // 完全移除 transition
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                    },
                                    '&:active': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                        transform: 'scale(0.95)',
                                    }
                                }}
                                disableRipple={true}
                                disableFocusRipple={true}
                                disableTouchRipple={true}
                            >
                                {config.selectedGroups.length === wordGroups.length ? '全部取消' : '全選'}
                            </Button>
                        </Box>
                        
                        {/* List 格式的單字組選擇 - 完全無動畫版本 */}
                        <List 
                            sx={{ 
                                backgroundColor: 'white',
                                borderRadius: 2,
                                border: '1px solid #000000',
                                maxHeight: 300,
                                overflow: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '4px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    background: 'transparent',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    background: 'rgba(255, 152, 0, 0.3)',
                                    borderRadius: '2px',
                                },
                            }}
                        >
                            {wordGroups.map((group, index) => {
                                const isSelected = config.selectedGroups.includes(group.groupIndex);
                                return (
                                    <React.Fragment key={group.groupIndex}>
                                        <ListItem disablePadding>
                                            <ListItemButton 
                                                onClick={() => handleGroupToggle(group.groupIndex)}
                                                sx={{
                                                    backgroundColor: isSelected ? 'rgba(255, 152, 0, 0.15)' : 'transparent',                                                   
                                                    transition: 'none',
                                                    animation: 'none',
                                                    transform: 'none',
                                                    '&:hover': {
                                                        backgroundColor: isSelected 
                                                            ? 'rgba(255, 152, 0, 0.25)' 
                                                            : 'rgba(255, 152, 0, 0.08)',
                                                        transition: 'none',
                                                    },
                                                    '&:active': {
                                                        backgroundColor: isSelected 
                                                            ? 'rgba(255, 152, 0, 0.35)' 
                                                            : 'rgba(255, 152, 0, 0.15)',
                                                        transform: 'scale(0.98)',
                                                    },
                                                    py: 1.5,
                                                    // 禁用 Material-UI ListItemButton 的所有內建效果
                                                    '&.MuiButtonBase-root': {
                                                        transition: 'none',
                                                    }
                                                }}
                                                disableRipple={true}
                                                disableTouchRipple={true}  
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    {isSelected ? (
                                                        <CheckBoxIcon sx={{ color: '#ff9800' }} />
                                                    ) : (
                                                        <CheckBoxOutlineBlankIcon sx={{ color: '#999' }} />
                                                    )}
                                                </ListItemIcon>
                                                <ListItemText 
                                                    primary={
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <Typography 
                                                                variant="body1"
                                                                sx={{ 
                                                                    fontWeight: isSelected ? 'bold' : 'normal',
                                                                    color: isSelected ? '#ff9800' : '#000000',
                                                                    fontSize: { xs: '0.95rem', sm: '1rem' }
                                                                }}
                                                            >
                                                                {group.groupIndex}. {group.displayName}
                                                            </Typography>
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    color: '#666666',
                                                                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                                                }}
                                                            >
                                                                {group.wordCount} words
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                        {index < wordGroups.length - 1 && (
                                            <Divider variant="inset" component="li" />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    </CardContent>
                </Card>
            )}

            {/* 熟練度選項 */}
            <Card sx={{ 
                mb: 3,
                backgroundColor: '#ff9800',
                transition: 'none',
            }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            mb: 2, 
                            color: '#000000',
                            fontWeight: 'bold',
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        包含熟練度
                    </Typography>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1 
                    }}>
                        {(['mastered', 'somewhat_familiar', 'not_familiar'] as ProficiencyLevel[]).map(level => (
                            <FormControlLabel
                                key={level}
                                control={
                                    <Checkbox
                                        checked={config.proficiencyLevels.includes(level)}
                                        onChange={(e) => handleProficiencyChange(level, e.target.checked)}
                                        sx={{
                                            color: '#000000',
                                            transition: 'none',  // 移除 Checkbox transition
                                            '&.Mui-checked': {
                                                color: '#000000',
                                            },
                                            '&:active': {
                                                transform: 'scale(0.9)',
                                            },
                                            // 禁用 Checkbox 的所有內建動畫
                                            '& .MuiSvgIcon-root': {
                                                transition: 'none',
                                            }
                                        }}
                                        disableRipple={true}
                                        disableFocusRipple={true}
                                        disableTouchRipple={true}
                                    />
                                }
                                label={
                                    <Chip
                                        label={getProficiencyLabel(level)}
                                        size="small"
                                        sx={{
                                            backgroundColor: getProficiencyColor(level),
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                        }}
                                    />
                                }
                            />
                        ))}
                    </Box>
                </CardContent>
            </Card>

            {/* 篩選選項 */}
            <Card sx={{ 
                mb: 4,
                backgroundColor: '#ff9800',
                transition: 'none',
            }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            mb: 2, 
                            color: '#000000',
                            fontWeight: 'bold',
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        篩選選項
                    </Typography>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={config.onlyFavorites}
                                onChange={(e) => handleFavoriteToggle(e.target.checked)}
                                sx={{
                                    color: '#000000',
                                    transition: 'none',
                                    '&.Mui-checked': {
                                        color: '#000000',
                                    },
                                    '&:active': {
                                        transform: 'scale(0.9)',
                                    },
                                    '& .MuiSvgIcon-root': {
                                        transition: 'none',
                                    }
                                }}
                                disableRipple={true}
                                disableFocusRipple={true}
                                disableTouchRipple={true}
                            />
                        }
                        label={
                            <Typography sx={{ 
                                color: '#000000',
                                fontSize: { xs: '0.9rem', sm: '1rem' }
                            }}>
                                只包括已加入最愛的生字
                            </Typography>
                        }
                    />
                </CardContent>
            </Card>
            
            {/* 開始測試按鈕 */}
            <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleStartTest}
                disabled={!config.level || config.selectedGroups.length === 0}
                sx={{
                    backgroundColor: '#ff9800',
                    color: '#ffffff',
                    transition: 'none',  // 完全移除 transition
                    '&:hover': {
                        backgroundColor: '#e65100',
                        color: '#ffffff'
                    },
                    '&:active': {
                        backgroundColor: '#d84315',
                        transform: 'scale(0.98)',
                    },
                    '&:disabled': {
                        backgroundColor: '#cccccc',
                        color: '#666666'
                    },
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    fontWeight: 'bold',
                    // 禁用所有 Material-UI Button 的內建動畫
                    '&.MuiButtonBase-root': {
                        transition: 'n  one',
                    }
                }}
                disableRipple={true}
                disableFocusRipple={true}
                disableTouchRipple={true}
                disableElevation={true}
            >
                開始測試 {getTotalSelectedWords() > 0 && `(${getTotalSelectedWords()} 個單字)`}
            </Button>
        </Box>
    );
};

export default TestSetup;
