// WordCard.tsx (修改版本 - test 模式 flip 後顯示完整內容)
import { Card, CardContent, Typography, Box, IconButton, Chip, Divider } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useState } from 'react';
import type { Vocabulary } from '../../api/vocabularyApi';
import type { JSX } from 'react';
import filledHeartImg from "../../assets/filled_heart.png";
import emptyHeartImg from "../../assets/empty_heart.png";

type WordCardProps = {
    word: Vocabulary;
    onPrevious?: () => void;
    onNext?: () => void;
    showPrevious?: boolean;
    showNext?: boolean;
    mode?: 'study' | 'test';
    isFavorite?: boolean;
    onFavoriteToggle?: (wordId: string) => void;
    // 新增測試模式相關 props
    onCardClick?: () => void;
    isFlipped?: boolean;
    hideControls?: boolean; // 是否隱藏控制按鈕
}

const WordCard = ({
    word,
    onPrevious,
    onNext,
    showPrevious = false,
    showNext = false,
    mode = 'study',
    isFavorite = false,
    onFavoriteToggle,
    onCardClick,
    isFlipped: propIsFlipped,
    hideControls = false
}: WordCardProps): JSX.Element => {
    const [internalIsFlipped, setInternalIsFlipped] = useState(false);
    
    // 使用外部 prop 或內部 state
    const isFlipped = propIsFlipped !== undefined ? propIsFlipped : internalIsFlipped;

    const handlePlayAudio = (accent: 'en-US' | 'en-GB') => {
        const utterance = new SpeechSynthesisUtterance(word.word);
        utterance.lang = accent;
        
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice =>
            voice.lang === accent || voice.lang.startsWith(accent.split('-')[0])
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        speechSynthesis.speak(utterance);
    };

    const getPartOfSpeechColor = (pos: string) => {
        const colors: Record<string, string> = {
            'exclamation': '#e91e63',
            'verb': '#4caf50',
            'indefinite article': '#9c27b0',
            'noun': '#2196f3',
            'adjective': '#ff9800',
            'ordinal number': '#795548',
            'conjunction': '#607d8b',
            'determiner': '#f44336',
            'adverb': '#00bcd4',
            'auxiliary verb': '#8bc34a',
            'definite article': '#673ab7',
            'preposition': '#ff5722',
            'infinitive marker': '#009688',
            'number': '#3f51b5',
            'modal verb': '#cddc39',
            'linking verb': '#ffc107',
            'pronoun': '#e91e63',
            default: '#757575',
        };
        return colors[pos.toLowerCase()] || colors.default;
    };

    const handleCardClick = () => {
        if (mode === 'test') {
            if (onCardClick) {
                onCardClick();
            } else {
                setInternalIsFlipped(!internalIsFlipped);
            }
        }
    };

    const handleFavoriteClick = () => {
        if (onFavoriteToggle) {
            onFavoriteToggle(String(word.id || word.word));
        }
    };

    // Study 模式的完整內容組件
    const StudyContent = () => (
        <>
            {/* 單詞區域 */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'left',
                textAlign: 'left',
                flexShrink: 0
            }}>
                <Typography
                    variant="h2"
                    sx={{
                        fontWeight: 'bold',
                        color: '#000000',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                        fontSize: { xs: '2rem', sm: '3rem' },
                    }}
                >
                    {word.word}
                </Typography>
            </Box>

            {/* 分隔線 */}
            <Divider sx={{ width: '100%', flexShrink: 0, mt: 2, mb: 2 }} />

            {/* 解釋區域 */}
            <Box sx={{
                height: { xs: '180px', sm: '200px' },
                width: '100%',
                mb: 2,
                flexShrink: 0,
                overflow: 'hidden'
            }}>
                <Box sx={{
                    height: '100%',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '3px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(255, 152, 0, 0.2)',
                        borderRadius: '2px',
                    },
                }}>
                    {/* 中文解釋與詞性標籤 */}
                    {word.chineseDefinition && (
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                mb: 1,
                            }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#000000',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    解釋
                                </Typography>
                                <Chip
                                    label={word.partOfSpeech}
                                    size="small"
                                    sx={{
                                        backgroundColor: getPartOfSpeechColor(word.partOfSpeech),
                                        color: '#ffffff',
                                        fontWeight: 'bold',
                                        fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#000000',
                                    lineHeight: 1.3,
                                    fontWeight: 500,
                                    fontSize: { xs: '1rem', sm: '1.1rem' },
                                    textAlign: 'left',
                                    '&::before': {
                                        content: '"。 "',
                                        fontWeight: 'bold'
                                    }
                                }}
                            >
                                {word.chineseDefinition}
                            </Typography>
                        </Box>
                    )}

                    {/* 英文解釋 */}
                    {word.englishDefinition && (
                        <Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#000000',
                                    lineHeight: 1.3,
                                    fontWeight: 500,
                                    fontStyle: 'normal',
                                    fontSize: { xs: '1rem', sm: '1.1rem' },
                                    textAlign: 'left',
                                    '&::before': {
                                        content: '"。 "',
                                        fontWeight: 'bold'
                                    }
                                }}
                            >
                                {word.englishDefinition}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* 例句區域 */}
            <Box sx={{
                height: { xs: '120px', sm: '140px' },
                width: '100%',
                flexShrink: 0,
                minHeight: { xs: '120px', sm: '140px' },
                maxHeight: { xs: '120px', sm: '140px' }
            }}>
                {word.example ? (
                    <Box sx={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#fff3e0',
                        border: '1px solid #ff9800',
                        borderRadius: 2,
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box'
                    }}>
                        <Typography
                            variant="body1"
                            sx={{
                                color: '#000000',
                                fontWeight: 'bold',
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                textAlign: 'left',
                                flexShrink: 0
                            }}
                        >
                            例句
                        </Typography>
                        <Box sx={{
                            flex: 1,
                            overflow: 'auto',
                            mt: 1,
                            '&::-webkit-scrollbar': {
                                width: '3px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(255, 152, 0, 0.2)',
                                borderRadius: '2px',
                            },
                        }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#000000',
                                    lineHeight: 1.4,
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    textAlign: 'left',
                                    '&::before': {
                                        content: '"。 "',
                                        fontWeight: 'bold',
                                    }
                                }}
                            >
                                {word.example}
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f5f5f5',
                        border: '1px dashed #cccccc',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#999999',
                                fontStyle: 'italic'
                            }}
                        >
                            無例句
                        </Typography>
                    </Box>
                )}
            </Box>
        </>
    );

    return (
        <Card
            sx={{
                width: '100%',
                height: { xs: '100%', sm: '630px' },
                cursor: mode === 'test' ? 'pointer' : 'default',
                transition: 'transform 0.3s, box-shadow 0.3s',
                backgroundColor: '#ffffff',
                border: '2px solid #ff9800',
                borderRadius: { xs: 0, sm: 3 },
                position: 'relative',
                '&:hover': {
                    transform: { xs: 'none', sm: 'scale(1.02)' },
                    boxShadow: '0 8px 25px rgba(255, 152, 0, 0.3)',
                    borderColor: '#e65100',
                },
            }}
            onClick={handleCardClick}
        >
            {/* 右上角控制區域 - test 模式 flip 後也顯示 */}
            {(!hideControls || (mode === 'test' && isFlipped)) && (
                <Box sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    zIndex: 10,
                }}>
                    {/* 英國國旗發音按鈕 */}
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio('en-GB');
                        }}
                        sx={{
                            width: { xs: '26px', sm: '32px' },
                            height: { xs: '26px', sm: '32px' },
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            border: '1px solid #ccc',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': {
                                transform: 'scale(1.1)',
                            },
                        }}
                        title="British English pronunciation"
                    >
                        <svg width="100%" height="100%" viewBox="0 0 32 21" style={{ transform: 'scale(1, 1.52)' }}>
                            <rect width="32" height="21" fill="#012169"/>
                            <path d="M0,0 L32,21 M32,0 L0,21" stroke="#fff" strokeWidth="2.1"/>
                            <path d="M0,0 L32,21 M32,0 L0,21" stroke="#C8102E" strokeWidth="1.3"/>
                            <rect x="13.3" y="0" width="5.3" height="21" fill="#fff"/>
                            <rect x="0" y="7.9" width="32" height="5.3" fill="#fff"/>
                            <rect x="14.6" y="0" width="2.7" height="21" fill="#C8102E"/>
                            <rect x="0" y="9.2" width="32" height="2.7" fill="#C8102E"/>
                        </svg>
                    </Box>

                    {/* 美國國旗發音按鈕 */}
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio('en-US');
                        }}
                        sx={{
                            width: { xs: '26px', sm: '32px' },
                            height: { xs: '26px', sm: '32px' },
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            border: '1px solid #ccc',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': {
                                transform: 'scale(1.1)',
                            },
                        }}
                        title="American English pronunciation"
                    >
                        <svg width="100%" height="100%" viewBox="0 0 32 21" style={{ transform: 'scale(1, 1.52)' }}>
                            <rect width="32" height="21" fill="#B22234"/>
                            <rect x="0" y="1.6" width="32" height="1.6" fill="#fff"/>
                            <rect x="0" y="4.8" width="32" height="1.6" fill="#fff"/>
                            <rect x="0" y="8.1" width="32" height="1.6" fill="#fff"/>
                            <rect x="0" y="11.3" width="32" height="1.6" fill="#fff"/>
                            <rect x="0" y="14.5" width="32" height="1.6" fill="#fff"/>
                            <rect x="0" y="17.8" width="32" height="1.6" fill="#fff"/>
                            <rect x="0" y="0" width="12.8" height="11.3" fill="#3C3B6E"/>
                        </svg>
                    </Box>

                    {/* 最愛按鈕 */}
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFavoriteClick();
                        }}
                        sx={{
                            width: 32,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'scale(1.1)',
                            },
                        }}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <img
                            src={isFavorite ? filledHeartImg : emptyHeartImg}
                            alt={isFavorite ? "Remove from favorites" : "Add to favorites"}
                            style={{ width: '26px', height: '23px' }}
                        />
                    </Box>
                </Box>
            )}

            {/* 左下角箭頭 */}
            {showPrevious && (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrevious?.();
                    }}
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: 16,
                        backgroundColor: 'white',
                        boxShadow: 2,
                        width: 48,
                        height: 48,
                        border: '2px solid #ff9800',
                        color: '#ff9800',
                        zIndex: 10,
                        '&:hover': {
                            backgroundColor: '#fff3e0',
                            transform: 'scale(1.1)',
                        },
                    }}
                >
                    <ArrowBackIosIcon fontSize="small" />
                </IconButton>
            )}

            {/* 右下角箭頭 */}
            {showNext && (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        onNext?.();
                    }}
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        backgroundColor: 'white',
                        boxShadow: 2,
                        width: 48,
                        height: 48,
                        border: '2px solid #ff9800',
                        color: '#ff9800',
                        zIndex: 10,
                        '&:hover': {
                            backgroundColor: '#fff3e0',
                            transform: 'scale(1.1)',
                        },
                    }}
                >
                    <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
            )}

            <CardContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflowY: { xs: 'auto', sm: 'visible' },
                    p: { xs: 3, sm: 4 },
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
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: 'rgba(255, 152, 0, 0.5)',
                    },
                }}
            >
                {mode === 'study' ? (
                    <StudyContent />
                ) : (
                    // 測試模式
                    <>
                        {!isFlipped ? (
                            <Box sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                gap: 3
                            }}>
                                <Typography
                                    variant="h2"
                                    sx={{
                                        fontWeight: 'bold',
                                        color: '#000000',
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                                        fontSize: { xs: '2rem', sm: '3rem' }
                                    }}
                                >
                                    {word.word}
                                </Typography>

                                <Chip
                                    label={word.partOfSpeech}
                                    sx={{
                                        backgroundColor: getPartOfSpeechColor(word.partOfSpeech),
                                        color: '#ffffff',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        padding: '8px 12px',
                                    }}
                                />

                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#666666',
                                        fontStyle: 'italic'
                                    }}
                                >
                                    點擊卡片查看答案
                                </Typography>
                            </Box>
                        ) : (
                            // 測試模式 flip 後顯示完整的 study 內容
                            <StudyContent />
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default WordCard;
