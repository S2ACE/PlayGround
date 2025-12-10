import React, { useState, useEffect, useCallback, useMemo, type JSX } from 'react';
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
	Divider,
} from '@mui/material';
import { KeyboardArrowLeft } from '@mui/icons-material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useNavigate } from 'react-router-dom';
import { vocabularyService, type Vocabulary } from '../../services/VocabularyService';
import LoadingSpinner from '../common/LoadingSpinner';

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
	onlyFavourites: boolean;
	proficiencyLevels: ProficiencyLevel[];
}

export interface VocabularyProgress {
	vocabularyId: string;
	masteredCount: number;
	currentProficiency: ProficiencyLevel;
	lastTestDate: string;
}

const TestSetup = (): JSX.Element => {
	const navigate = useNavigate();
	const [config, setConfig] = useState<TestConfig>({
		level: '',
		selectedGroups: [],
		onlyFavourites: false,
		proficiencyLevels: ['mastered', 'somewhat_familiar', 'not_familiar'],
	});

	const [levels, setLevels] = useState<string[]>([]);
	const [vocabularyData, setVocabularyData] = useState<Vocabulary[]>([]);
	const [loading, setLoading] = useState(true);

	// Build display name for a group, e.g. "A-C" or "B"
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

	// Create 20-word groups for a given level
	const createWordGroups = useCallback(
		(data: Vocabulary[], currentLevel: string): WordGroup[] => {
			const levelWords = data
				.filter((word) => word.level === currentLevel)
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
					groupIndex,
				});
			}

			return groups;
		},
		[createGroupDisplayName],
	);

	// Load all vocabulary and available levels
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const data = await vocabularyService.getAllVocabulary('en');
				setVocabularyData(data);
				const availableLevels = vocabularyService.getAllLevels(data);
				setLevels(availableLevels);
			} catch (error) {
				console.error('Failed to fetch vocabulary:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const wordGroups = useMemo(() => {
		if (!config.level || vocabularyData.length === 0) return [];
		return createWordGroups(vocabularyData, config.level);
	}, [config.level, vocabularyData, createWordGroups]);

	// Change level and reset selected groups
	const handleLevelChange = useCallback((level: string) => {
		setConfig((prev) => ({
			...prev,
			level,
			selectedGroups: [],
		}));
	}, []);

	// Toggle a single word group
	const handleGroupToggle = useCallback((groupIndex: number) => {
		setConfig((prev) => ({
			...prev,
			selectedGroups: prev.selectedGroups.includes(groupIndex)
				? prev.selectedGroups.filter((g) => g !== groupIndex)
				: [...prev.selectedGroups, groupIndex],
		}));
	}, []);

	// Select or clear all word groups
	const handleSelectAllGroups = useCallback(() => {
		const allGroupIndices = wordGroups.map((g) => g.groupIndex);
		setConfig((prev) => ({
			...prev,
			selectedGroups:
				prev.selectedGroups.length === allGroupIndices.length ? [] : allGroupIndices,
		}));
	}, [wordGroups]);

	// Toggle individual proficiency levels
	const handleProficiencyChange = useCallback((level: ProficiencyLevel, checked: boolean) => {
		if (checked) {
			setConfig((prev) => ({
				...prev,
				proficiencyLevels: [...prev.proficiencyLevels, level],
			}));
		} else {
			setConfig((prev) => ({
				...prev,
				proficiencyLevels: prev.proficiencyLevels.filter((l) => l !== level),
			}));
		}
	}, []);

	// Toggle "only favourites" filter
	const handleFavouriteToggle = useCallback((checked: boolean) => {
		setConfig((prev) => ({ ...prev, onlyFavourites: checked }));
	}, []);

	const getProficiencyLabel = useCallback((level: ProficiencyLevel): string => {
		switch (level) {
			case 'mastered':
				return '熟記';
			case 'somewhat_familiar':
				return '不太熟';
			case 'not_familiar':
				return '不記得';
		}
	}, []);

	const getProficiencyColor = useCallback((level: ProficiencyLevel): string => {
		switch (level) {
			case 'mastered':
				return '#4caf50';
			case 'somewhat_familiar':
				return '#ED6C02';
			case 'not_familiar':
				return '#f44336';
		}
	}, []);

	/*
	// If you want to show total selected words later, you can re-enable this:
	const getTotalSelectedWords = useCallback((): number => {
		return wordGroups
			.filter(group => config.selectedGroups.includes(group.groupIndex))
			.reduce((total, group) => total + group.wordCount, 0);
	}, [wordGroups, config.selectedGroups]);
	*/

	// Validate config and start test
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
		return <LoadingSpinner message="Loading" />;
	}

	return (
		<Box sx={{ maxWidth: 600, width: '100%', mx: 'auto', mt: { xs: 1, sm: 4 }, px: 2 }}>
			{/* Header: back button + title */}
			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'row' },
					alignItems: { xs: 'flex-start', sm: 'center' },
					justifyContent: { sm: 'center' },
					mb: 4,
					position: { sm: 'relative' },
				}}
			>
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
						left: { xs: 0, sm: 0 },
						mb: { xs: 1, sm: 0 },
						minWidth: 'auto',
						'&:hover': {
							backgroundColor: theme.palette.button.hover,
						},
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
						textAlign: 'center',
						width: '100%',
					}}
				>
					測試設置
				</Typography>
			</Box>

			{/* Level selection */}
			<Card
				sx={(theme) => ({
					mb: 3,
					backgroundColor: theme.palette.primary.light,
					// Disable all transitions/animations on this card
					transition: 'none',
					animation: 'none',
					transform: 'none',
				})}
			>
				<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
					<Typography
						variant="h6"
						sx={{
							mb: 2,
							color: 'primary.contrastText',
							fontWeight: 'bold',
							fontSize: { xs: '1.1rem', sm: '1.25rem' },
						}}
					>
						選擇等級
					</Typography>
					<FormControl fullWidth>
						<InputLabel
							sx={{
								color: 'primary.contrastText',
								'&.Mui-focused': { color: 'primary.contrastText' },
							}}
						>
							等級
						</InputLabel>
						<Select
							value={config.level}
							label="等級"
							onChange={(e) => handleLevelChange(e.target.value)}
							sx={(theme) => ({
								backgroundColor: 'white',
								color: theme.palette.primary.contrastText,
								transition: 'none',
								'& .MuiSelect-icon': {
									color: theme.palette.primary.contrastText,
								},
								'& .MuiOutlinedInput-notchedOutline': {
									borderColor: theme.palette.primary.contrastText,
									transition: 'none',
								},
								'&:hover .MuiOutlinedInput-notchedOutline': {
									borderColor: theme.palette.primary.contrastText,
								},
								'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
									borderColor: theme.palette.primary.contrastText,
								},
								// Disable all built-in Select animations
								'& .MuiSelect-select': {
									transition: 'none',
								},
							})}
							MenuProps={{
								slotProps: {
									paper: {
										sx: {
											'& .MuiMenuItem-root': {
												transition: 'none',
												'&:hover': {
													backgroundColor: 'rgba(255, 152, 0, 0.1)',
												},
											},
										},
									},
								},
								transitionDuration: 0,
							}}
						>
							{levels.map((level) => (
								<MenuItem key={level} value={level}>
									{level.toUpperCase()}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</CardContent>
			</Card>

			{/* Word group selection */}
			{config.level && wordGroups.length > 0 && (
				<Card
					sx={{
						mb: 3,
						backgroundColor: 'primary.light',
						transition: 'none',
						animation: 'none',
					}}
				>
					<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								mb: 2,
							}}
						>
							<Typography
								// {config.selectedGroups.length > 0 && `(已選 ${getTotalSelectedWords()} 個單字)`}
								variant="h6"
								sx={{
									color: '#000000',
									fontWeight: 'bold',
									fontSize: { xs: '1.1rem', sm: '1.25rem' },
								}}
							>
								選擇單字組
							</Typography>
							<Button
								size="small"
								onClick={handleSelectAllGroups}
								sx={{
									color: '#000000',
									fontWeight: 'bold',
									textTransform: 'none',
									transition: 'none',
									'&:hover': {
										backgroundColor: 'rgba(0, 0, 0, 0.1)',
									},
									'&:active': {
										backgroundColor: 'rgba(0, 0, 0, 0.2)',
										transform: 'scale(0.95)',
									},
								}}
								disableRipple
								disableFocusRipple
								disableTouchRipple
							>
								{config.selectedGroups.length === wordGroups.length ? '全部取消' : '全選'}
							</Button>
						</Box>

						{/* Word group list without animations */}
						<WordGroupList
							groups={wordGroups}
							selectedGroups={config.selectedGroups}
							onToggle={handleGroupToggle}
						/>
					</CardContent>
				</Card>
			)}

			{/* Proficiency filters */}
			<Card
				sx={{
					mb: 3,
					backgroundColor: '#ff9800',
					transition: 'none',
				}}
			>
				<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
					<Typography
						variant="h6"
						sx={{
							mb: 2,
							color: '#000000',
							fontWeight: 'bold',
							fontSize: { xs: '1.1rem', sm: '1.25rem' },
						}}
					>
						包含熟練度
					</Typography>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							gap: 1,
						}}
					>
						{(['mastered', 'somewhat_familiar', 'not_familiar'] as ProficiencyLevel[]).map(
							(level) => (
								<FormControlLabel
									key={level}
									control={
										<Checkbox
											checked={config.proficiencyLevels.includes(level)}
											onChange={(e) =>
												handleProficiencyChange(level, e.target.checked)
											}
											sx={{
												color: '#000000',
												transition: 'none',
												'&.Mui-checked': {
													color: '#000000',
												},
												'&:active': {
													transform: 'scale(0.9)',
												},
												// Disable checkbox icon animations
												'& .MuiSvgIcon-root': {
													transition: 'none',
												},
											}}
											disableRipple
											disableFocusRipple
											disableTouchRipple
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
												fontSize: { xs: '0.7rem', sm: '0.75rem' },
											}}
										/>
									}
								/>
							),
						)}
					</Box>
				</CardContent>
			</Card>

			{/* Extra filters */}
			<Card
				sx={{
					mb: 4,
					backgroundColor: '#ff9800',
					transition: 'none',
				}}
			>
				<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
					<Typography
						variant="h6"
						sx={{
							mb: 2,
							color: '#000000',
							fontWeight: 'bold',
							fontSize: { xs: '1.1rem', sm: '1.25rem' },
						}}
					>
						篩選選項
					</Typography>
					<FormControlLabel
						control={
							<Checkbox
								checked={config.onlyFavourites}
								onChange={(e) => handleFavouriteToggle(e.target.checked)}
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
									},
								}}
								disableRipple
								disableFocusRipple
								disableTouchRipple
							/>
						}
						label={
							<Typography
								sx={{
									color: '#000000',
									fontSize: { xs: '0.9rem', sm: '1rem' },
								}}
							>
								只包括已加入最愛的生字
							</Typography>
						}
					/>
				</CardContent>
			</Card>

			{/* Start test button */}
			<Button
				// {getTotalSelectedWords() > 0 && `(${getTotalSelectedWords()} 個單字)`}
				variant="contained"
				size="large"
				fullWidth
				onClick={handleStartTest}
				disabled={!config.level || config.selectedGroups.length === 0}
				sx={(theme) => ({
					backgroundColor: theme.palette.primary.light,
					color: theme.palette.primary.contrastText,
					transition: 'none',
					'&:hover': {
						backgroundColor: theme.palette.primary.dark,
					},
					'&:active': {
						backgroundColor: '#d84315',
						transform: 'scale(0.98)',
					},
					'&:disabled': {
						backgroundColor: '#cccccc',
						color: '#666666',
					},
					py: { xs: 1.5, sm: 2 },
					fontSize: { xs: '1rem', sm: '1.2rem' },
					fontWeight: 'bold',
					// Explicitly disable any Button base transitions
					'&.MuiButtonBase-root': {
						transition: 'none',
					},
				})}
				disableRipple
				disableFocusRipple
				disableTouchRipple
				disableElevation
			>
				開始測試
			</Button>
		</Box>
	);
};

interface WordGroupListProps {
	groups: WordGroup[];
	selectedGroups: number[];
	onToggle: (groupIndex: number) => void;
}

// Separate memoized list for word groups to avoid re-rendering the whole setup
const WordGroupList = React.memo((props: WordGroupListProps): JSX.Element => {
	const { groups, selectedGroups, onToggle } = props;

	return (
		<List
			sx={(theme) => ({
				backgroundColor: 'white',
				borderRadius: 2,
				border: '1px solid',
				borderColor: '#000000',
				maxHeight: 300,
				overflow: 'auto',
				'&::-webkit-scrollbar': {
					width: '4px',
				},
				'&::-webkit-scrollbar-track': {
					background: 'transparent',
				},
				'&::-webkit-scrollbar-thumb': {
					background: theme.palette.primary.main,
					borderRadius: '2px',
				},
				'&::-webkit-scrollbar-thumb:hover': {
					background: theme.palette.primary.dark,
				},
			})}
		>
			{groups.map((group, index) => {
				const isSelected = selectedGroups.includes(group.groupIndex);
				return (
					<React.Fragment key={group.groupIndex}>
						<ListItem disablePadding>
							<ListItemButton
								onClick={() => onToggle(group.groupIndex)}
								sx={{
									backgroundColor: isSelected
										? 'rgba(255, 152, 0, 0.15)'
										: 'transparent',
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
									'&.MuiButtonBase-root': {
										transition: 'none',
									},
								}}
								disableRipple
								disableTouchRipple
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
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
											}}
										>
											<Typography
												variant="body1"
												sx={{
													fontWeight: isSelected ? 'bold' : 'normal',
													color: isSelected ? '#ff9800' : '#000000',
													fontSize: { xs: '0.95rem', sm: '1rem' },
												}}
											>
												{group.groupIndex}. {group.displayName}
											</Typography>
											<Typography
												variant="body2"
												sx={{
													color: '#666666',
													fontSize: { xs: '0.8rem', sm: '0.875rem' },
												}}
											>
												{group.wordCount} words
											</Typography>
										</Box>
									}
								/>
							</ListItemButton>
						</ListItem>
						{index < groups.length - 1 && (
							<Divider
								variant="inset"
								component="li"
								sx={(theme) => ({ borderColor: theme.palette.share.divider })}
							/>
						)}
					</React.Fragment>
				);
			})}
		</List>
	);
});

export default TestSetup;