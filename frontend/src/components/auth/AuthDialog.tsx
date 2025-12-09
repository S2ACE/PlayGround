import { useState, useEffect, type JSX } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	IconButton,
	Box,
	Alert,
	Stack,
	CircularProgress,
	Divider,
	Typography,
	useTheme,
} from '@mui/material';
import { Google, Close, ArrowBack } from '@mui/icons-material';
import { authService } from '../../services/AuthService';

type AuthDialogProps = {
	open: boolean;
	onClose: () => void;
};

const AuthDialog = ({ open, onClose }: AuthDialogProps): JSX.Element => {
	const theme = useTheme();
	// 登入表單狀態
    //Login Step 1：Email 階段, Login Step 2：密碼階段
	const [loginStep, setLoginStep] = useState(1);
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [emailCheckLoading, setEmailCheckLoading] = useState(false);
	const [error, setError] = useState('');

	// Email 檢查結果狀態
	const [emailCheckResult, setEmailCheckResult] = useState<{
		exists: boolean;
		hasEmailProvider?: boolean;
	} | null>(null);

	// 忘記密碼
	const [forgotMessage, setForgotMessage] = useState('');
	const [forgotCooldown, setForgotCooldown] = useState(0);

	const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
	const [verificationEmail, setVerificationEmail] = useState('');
	const [showGoogleSuggestionDialog, setShowGoogleSuggestionDialog] = useState(false);

	const textFieldSx = {
		'& .MuiInputLabel-root': {
			paddingX: 1,
			color: 'text.primary',
		},
		'& .MuiInputLabel-shrink': {
			paddingX: 1,
			color: 'text.primary',
		},
		'& .MuiOutlinedInput-root': {
			color: 'text.primary',
			'& fieldset': { borderColor: '#555' },
			'&:hover fieldset': { borderColor: '#888' },
			'&.Mui-focused fieldset': { borderColor: 'primary.light' },
			'& .MuiInputBase-input': {
				fontSize: { xs: '1rem', sm: '1.3rem' },
			},
		},
	};

	useEffect(() => {
		if (forgotCooldown <= 0) return;

		const timer = window.setInterval(() => {
			setForgotCooldown((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);

		return () => window.clearInterval(timer);
	}, [forgotCooldown]);

	const resetState = () => {
		setLoginStep(1);
		setIsLogin(true);
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		setError('');
		setLoading(false);
		setEmailCheckLoading(false);
		setEmailCheckResult(null);
		setShowGoogleSuggestionDialog(false);
		setForgotMessage('');
		setForgotCooldown(0);
	};

	const handleClose = () => {
		if (loading || emailCheckLoading) return;
		resetState();
		onClose();
	};

	const handleEmailContinue = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) {
			setError('請輸入電子郵件地址');
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError('請輸入有效的電子郵件地址');
			return;
		}

		console.log('🔍 開始檢查 Email:', email);
		setError('');
		 setForgotMessage('')
		setEmailCheckLoading(true);
		setEmailCheckResult(null);

		try {
			const accountStatus = await authService.checkEmailRegistrationStatus(email);
			console.log('📋 Email 檢查完整結果:', accountStatus);

			if (!accountStatus.exists) {
				// 完全新的用戶
				console.log('✅ 新用戶，允許註冊');
				setIsLogin(false);
				setLoginStep(2);
			} else {
				// 帳戶已存在 - 根據提供者決定
				console.log('⚠️ 帳戶已存在，分析登入方式...', {
					hasEmail: accountStatus.hasEmailProvider,
					hasGoogle: accountStatus.hasGoogleProvider,
					providers: accountStatus.providers,
					totalProviders: accountStatus.databaseInfo?.providerCount
				});
				
				if (accountStatus.hasEmailProvider) {
					console.log('🔄 帳戶支持email登入方式，引導密碼登入');
					setIsLogin(true);
					setLoginStep(2);
				} else if(accountStatus.hasGoogleProvider) {
					console.log('🔍 Email 已用 Google 註冊，提示用戶使用 Google 登入');
					setError('');
					setShowGoogleSuggestionDialog(true); // 顯示 Google 建議對話框
					setEmailCheckLoading(false);
					return;
				}
				else {
					// 異常狀態
					console.log('❓ 帳戶狀態異常');
					setError('帳戶狀態異常，請聯繫客服');
					setEmailCheckLoading(false);
					return;
				}
			}

			setEmailCheckResult({
				exists: accountStatus.exists,
				hasEmailProvider: accountStatus.hasEmailProvider
			});

		} catch (error: any) {
			console.error('❌ Email 檢查失敗:', error);
			console.log('⚠️ 檢查失敗，允許用戶嘗試註冊作為備用方案');
			setIsLogin(false);
			setLoginStep(2);
		} finally {
			setEmailCheckLoading(false);
		}
	};

	const handleAuthSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		// ✅ 如果是註冊但帳戶已存在，提供連結選項
		if (!isLogin && emailCheckResult?.exists) {
			setError('此帳戶已存在並支援 Google 登入。您可以：\n1. 使用 Google 登入\n2. 連結此帳戶以同時支援密碼和 Google 登入');
			return;
		}
		
		if (!isLogin && password !== confirmPassword) {
			setError('密碼確認不相符');
			return;
		}

		if (password.length < 6) {
			setError('密碼至少需要6個字元');
			return;
		}

		setLoading(true);
		setError('');
		setForgotMessage('');

		try {
			if (isLogin) {
				await authService.signInWithEmail(email, password);
				handleClose();
			} else {
				// ✅ 修改註冊處理
				const result = await authService.registerWithEmail(email, password);
				
				if (result.emailVerificationSent) {
					// 關閉登入 modal
					handleClose();
					
					// 顯示驗證 Email 通知
					setVerificationEmail(email);
					setShowEmailVerificationDialog(true);
				}
			}
		} catch (error: any) {
			console.error('❌ 認證失敗:', error);
			setError(getErrorMessage(error.code));
		} finally {
			setLoading(false);
		}
	};

    // ✅ 修正：返回第一步重新輸入 Email
    const handleBackToEmailInput = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
		setForgotMessage('');
		setForgotCooldown(0);
        setLoginStep(1);
        setIsLogin(true);
        setEmailCheckResult(null);
    };	

	// 修正的 Google 登入處理 - 使用 4 個空格縮進
	const handleGoogleSignIn = async () => {
		setLoading(true);
		setError('');
		setForgotMessage('');
		setForgotCooldown(0);

		try {
			console.log('🚀 開始 Google 登入...');
			await authService.signInWithGoogle();
			console.log('✅ Google 登入成功');
			handleClose();
		} catch (error: any) {
			console.log('❌ Google 登入遇到問題:', error);
			
			if (error.needsLinking) {
				console.log('🔗 檢測到需要帳戶連結:', error.email);
				console.log('📋 現有登入方式:', error.existingMethods);
				
				if (error.requiresPassword) {
					// 需要密碼來連結帳戶
					console.log('🔑 需要密碼驗證以連結帳戶');

					handleClose();
					
					// 提供清楚的指引
					setTimeout(() => {
						console.log('💡 顯示帳戶連結提示');
					}, 100);
				} else {
					// 其他連結情況
					console.log('❓ 未知的連結需求');
					setError('帳戶連結失敗，請聯繫客服');
				}
			} else {
				// 處理其他 Google 登入錯誤
				console.log('🔍 處理 Google 登入的其他錯誤');
				switch (error.code) {
					case 'auth/popup-closed-by-user':
					case 'auth/cancelled-popup-request':
						console.log('👤 用戶取消 Google 登入');
						// 不顯示錯誤，用戶主動取消
						break;
					case 'auth/popup-blocked':
						setError('彈出視窗被阻擋，請允許彈出視窗後重試');
						break;
					case 'auth/network-request-failed':
						setError('網路連接失敗，請檢查網路後重試');
						break;
					case 'auth/account-exists-with-different-credential':
						// 這種情況應該被 needsLinking 捕獲，但作為備用
						setError('此 Email 已有其他登入方式，請使用原本的方式登入');
						break;
					default:
						setError('Google 登入失敗，請稍後重試');
						console.error('🔥 Google 登入未知錯誤:', error);
				}
			}
		} finally {
			setLoading(false);
		}
	};

	const handleForgotPassword = async () => {
		if (!email) {
			setError('請先返回上一步輸入 Email，再重設密碼');
			return;
		}
		if (forgotCooldown > 0) {
			return;
		}

		setLoading(true);
		setError('');
		setForgotMessage('');

		try {
			await authService.sendPasswordResetEmail(email);
			setForgotMessage('重設密碼連結已寄出，請檢查您的信箱（包括垃圾郵件）。');
			setForgotCooldown(60);
		} catch (error: any) {
			console.error('忘記密碼失敗:', error);
			setError('重設密碼失敗，請稍後再試或確認 Email 是否正確。');
		} finally {
			setLoading(false);
		}
	};

    // 錯誤訊息處理
    const getErrorMessage = (errorCode: string): string => {
        switch (errorCode) {
            // ✅ 註冊錯誤
            case 'auth/email-already-in-use':
                setIsLogin(true); // 自動切換到登入模式
                return '此電子郵件已被註冊，請嘗試登入或使用其他電子郵件。';
            case 'auth/weak-password':
                return '密碼強度太弱，請設定至少 6 個字元的密碼。';
            // ✅ 主要的登入/認證錯誤（現代 Firebase 主要錯誤）
            case 'auth/invalid-credential':
                return 'Email 或密碼錯誤，請確認後重試。';
                //setShowForgotPassword(true); // 顯示忘記密碼選項
            // ✅ 格式錯誤
            case 'auth/invalid-email':
                return '電子郵件格式無效，請輸入正確的 Email 格式。';
            // ✅ 限制和安全錯誤
            case 'auth/too-many-requests':
                return '嘗試次數過多，請稍後再試或重設密碼。';
            case 'auth/user-disabled':
                return '此帳戶已被停用，請聯繫客服。';
            // ✅ 網路和服務錯誤
            case 'auth/network-request-failed':
                return '網路連線失敗，請檢查網路後重試。';
            case 'auth/operation-not-allowed':
                return '此登入方式尚未啟用，請聯繫客服。';
            // ✅ 社交登入錯誤（如果有使用 Google 登入）
            case 'auth/account-exists-with-different-credential':
                return '此 Email 已使用其他方式註冊，請嘗試 Google 登入。';
            // ✅ 預設錯誤
            default:
                console.error('未處理的 Firebase 錯誤:', errorCode);
                return (isLogin ? '登入失敗，請稍後再試。' : '註冊失敗，請稍後再試。');
        }
    };

    // 切換登入/註冊模式
    const switchMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

	return (
		<>
			<Dialog 
                open={open} 
                onClose={(_, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                        return;
                    }
                    handleClose();
                }}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            p: 1
                        }
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {loginStep === 2 && (
                                <IconButton onClick={handleBackToEmailInput} sx={{ mr: 1 }}>
                                    <ArrowBack />
                                </IconButton>
                            )}
                            <Typography variant="h5">
                                {loginStep === 1 ? '登入或建立帳號' : (isLogin ? '登入' : '建立帳號')}
                            </Typography>
                        </Box>
                        <IconButton onClick={handleClose} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                
                <DialogContent sx={{ pb: 3 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                            {error}
                        </Alert>
                    )}
					{forgotMessage && (
						<Alert severity="success" sx={{ mb: 2 }}>
						{forgotMessage}
						</Alert>
					)}
                    {/* 第一步：輸入Email + Google登入 */}
                    {loginStep === 1 && (
                        <>
                            <form onSubmit={handleEmailContinue}>
                                <Stack spacing={3} sx={{ mt: 1 }}>
                                    <TextField
                                        fullWidth
                                        type="email"
                                        label="電子郵件"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={emailCheckLoading || loading}
                                        variant="outlined"
                                        sx={textFieldSx}
                                        autoFocus
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={emailCheckLoading || loading}
                                        sx={{ 
                                            backgroundColor: 'primary.light',
                                            '&:hover': { backgroundColor: 'primary.dark' },
                                            py: { xs: 1.5, sm: 2 },
                                            fontWeight: 'bold',
                                            fontSize: { xs: '0.9rem', sm: '1rem' }                    
                                        }}
                                        startIcon={emailCheckLoading ? <CircularProgress size={20} /> : undefined}
                                    >
                                        {emailCheckLoading ? '檢查中...' : '繼續'}
                                    </Button>
                                </Stack>
                            </form>

                            <Divider sx={(theme) => ({ my: 3, borderColor: theme.palette.share.divider })}>或</Divider>

                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Google />}
                                onClick={handleGoogleSignIn}
                                disabled={loading || emailCheckLoading}
                                sx={(theme) => ({ 
                                    borderColor: 'primary.light',
                                    color: 'primary.light',
                                    '&:hover': { 
                                        borderColor: 'primary.dark', 
                                        color: 'primary.dark',
                                        backgroundColor: theme.palette.button.hover,
                                    },
                                    py: { xs: 1.5, sm: 2 },
                                    fontWeight: 'bold',
                                    fontSize: { xs: '0.9rem', sm: '1.0rem' }
                                })}
                            >
                                使用 Google 登入
                            </Button>
                        </>
                    )}

                    {/* 第二步：密碼輸入 */}
                    {loginStep === 2 && (
                        <>
                            {/* Email 資訊顯示 */}
                            <Box 
								sx={{ 
										mb: 2, 
										p: 2, 
										bgcolor: theme.palette.paper.background,
										borderRadius: 1,
								}}
							>
                                <Typography variant="body2" color="text.primary">
                                    {email}
                                </Typography>
                                <Typography variant="caption" color="text.primary">
                                    {isLogin ? '請輸入密碼登入' : '請建立密碼完成註冊'}
                                </Typography>
                                
                                {/* ✅ 修正：返回重新輸入 Email 按鈕 */}
                                <Box sx={{ mt: 1 }}>
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={handleBackToEmailInput}
                                        sx={(theme) => ({ 
											textDecoration: 'underline',
											'&:hover': {
												backgroundColor: theme.palette.button.hover,
											}
										 })}
                                    >
                                        使用其他電子郵件
                                    </Button>
                                </Box>
                                {/* 
                                {/* ✅ 顯示帳戶已存在且支援 Google 的提示
                                {!isLogin && emailCheckResult?.exists && (
                                    <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                                        <Typography variant="caption">
                                            此帳戶已支援 Google 登入。建立密碼後，您可同時使用 Google 和密碼登入。
                                        </Typography>
                                    </Alert>
                                )}
                                */}
                            </Box>

                            <form onSubmit={handleAuthSubmit}>
                                <Stack spacing={3}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label={isLogin ? "密碼" : "建立密碼"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        variant="outlined"
                                        helperText={!isLogin ? "至少 6 個字元" : ""}
                                        sx={textFieldSx}
										slotProps={{
											formHelperText: {
												sx: { color: 'text.primary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }
											}
										}}
                                        autoFocus
                                    />

                                    {!isLogin && (
                                        <TextField
                                            fullWidth
                                            type="password"
                                            label="確認密碼"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            disabled={loading}
                                            variant="outlined"
                                            sx={textFieldSx}
                                        />
                                    )}

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={loading}
                                        sx={{ 
                                            backgroundColor: 'primary.light',
                                            '&:hover': { backgroundColor: 'primary.dark' },
                                            py: { xs: 1.5, sm: 2 },
                                            fontWeight: 'bold',
                                            fontSize: { xs: '0.9rem', sm: '1rem' }                    
                                         }}
                                    >
                                        {loading ? (isLogin ? '登入中...' : '建立帳號中...') : (isLogin ? '登入' : '建立帳號')}
                                    </Button>
                                </Stack>								
                            </form>
                            
                            {/* ✅ 修正：建立新帳號按鈕返回第一步 */}
							<Box
								sx={{
									mt: 2,
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
							{isLogin ? (
								<>
								{/* 左邊：建立新帳號 */}
								<Button
									variant="text"
									size="small"
									onClick={switchMode}
									disabled={loading}
									sx={(theme) => ({
										color: 'text.primary',
										'&:hover': { backgroundColor: theme.palette.button.hover },
									})}
								>
									需要建立新帳號？
								</Button>

								{/* 右邊：忘記密碼（同色，含倒數） */}
								<Button
									variant="text"
									size="small"
									onClick={handleForgotPassword}
									disabled={loading || forgotCooldown > 0}
									sx={(theme) => ({
										color: 'text.primary',
										'&:hover': {
											backgroundColor:
											forgotCooldown > 0
												? 'transparent'
												: theme.palette.button.hover,
										},
									})}
								>
									{forgotCooldown > 0 ? `忘記密碼？ (${forgotCooldown}s)` : '忘記密碼？'}
								</Button>
								</>
							) : (
								<>
								<Box sx={{ width: 80 }} />
								<Button
									variant="text"
									size="small"
									onClick={handleBackToEmailInput}
									disabled={loading}
									sx={(theme) => ({
										marginLeft: 'auto',
										color: 'text.primary',
										'&:hover': { backgroundColor: theme.palette.button.hover },
									})}
								>
									已經有帳號？
								</Button>
								</>
							)}
							</Box>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ✅ 在這裡加入 Email 驗證通知 Dialog */}
            <Dialog 
                open={showEmailVerificationDialog} 
                onClose={() => setShowEmailVerificationDialog(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            p: 1
                        }
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                            sx={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: '50%', 
                                bgcolor: 'success.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ✅
                        </Box>
                        <Typography variant="h6">
                            註冊成功！
                        </Typography>
                    </Box>
                </DialogTitle>
                
                <DialogContent sx={{ pb: 2 }}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>帳戶建立成功！</strong>
                        </Typography>
                        <Typography variant="body2">
                            我們已發送驗證郵件到：
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.light' }}>
                            {verificationEmail}
                        </Typography>
                    </Alert>
                    
                    <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
                        請檢查您的電子郵箱（包括垃圾郵件資料夾），並點擊驗證連結以啟用您的帳戶。
                    </Typography>
                    
                    <Typography variant="body2" color="text.primary">
                        💡 <strong>提示：</strong>驗證 Email 後，您就可以同時使用 Google 和密碼登入了！
                    </Typography>
                </DialogContent>
                
                <DialogActions>
                    <Button 
                        onClick={() => setShowEmailVerificationDialog(false)} 
                        variant="contained"
                        fullWidth
						sx={{ 
							backgroundColor: 'primary.light',
							'&:hover': { backgroundColor: 'primary.dark' },
							py: { xs: 1.5, sm: 2 },
							fontWeight: 'bold',
							fontSize: { xs: '0.9rem', sm: '1.0rem' },
						}}
                    >
                        我知道了
                    </Button>
                </DialogActions>
            </Dialog>

			<Dialog 
				open={showGoogleSuggestionDialog} 
				onClose={() => setShowGoogleSuggestionDialog(false)}
				maxWidth="sm"
				fullWidth
				slotProps={{
					paper: {
						sx: {
							borderRadius: 2,
							p: 1,
						},
					},
				}}
			>
			<DialogTitle sx={{ px: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				<Box 
					sx={{ 
					width: 48, 
					height: 48, 
					borderRadius: '50%', 
					bgcolor: 'primary.light',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					}}
				>
					<Google sx={{ color: 'white', fontSize: 24 }} />
				</Box>
				<Typography variant="h6">
					此 Email 已註冊
				</Typography>
				</Box>
				<IconButton 
				onClick={() => setShowGoogleSuggestionDialog(false)}
				sx={{ position: 'absolute', right: 8, top: 8 }}
				>
				<Close />
				</IconButton>
			</DialogTitle>

			{/* ✅ 和主登入 Dialog 一樣，內容＋按鈕全都放在 DialogContent 裡 */}
			<DialogContent sx={{ pb: 3, px: 3 }}>
				<Alert severity="info" sx={{ mb: 2 }}>
					<Typography 
						variant="body1" 
						sx={{ 
							mb: 1 

						}}
					>
						<strong>{email}</strong> 已使用 Google 帳戶註冊
					</Typography>
					<Typography 
						variant="body2"

					>
						請使用 Google 登入以存取您的帳戶
					</Typography>
				</Alert>

				<Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
				如果您想使用密碼登入，請使用其他 Email 地址註冊。
				</Typography>

				<Typography variant="body2" color="text.primary" sx={{ mb: 3 }}>
				💡 <strong>提示：</strong>使用 Google 登入更快速且安全！
				</Typography>

				{/* 用 Stack 控制兩顆按鈕間距，寬度完全一致 */}
				<Stack spacing={1.5}>
				<Button 
					variant="contained"
					fullWidth
					startIcon={<Google />}
					onClick={handleGoogleSignIn}
					disabled={loading}
					sx={{ 
						backgroundColor: 'primary.light',
						'&:hover': { backgroundColor: 'primary.dark' },
						py: { xs: 1.5, sm: 2 },
						fontWeight: 'bold',
						fontSize: { xs: '0.9rem', sm: '1.0rem' },
					}}
				>
					{loading ? '登入中...' : '使用 Google 登入'}
				</Button>
				
				<Button 
					variant="outlined"
					fullWidth
					onClick={() => {
					setShowGoogleSuggestionDialog(false);
					setEmail('');
					setLoginStep(1);
					}}
					sx={(theme) => ({ 
					borderColor: 'primary.light',
					color: 'primary.light',
					'&:hover': { 
						borderColor: 'primary.dark', 
						color: 'primary.dark',
						backgroundColor: theme.palette.button.hover,
					},
					py: { xs: 1.5, sm: 2 },
					fontWeight: 'bold',
					fontSize: { xs: '0.9rem', sm: '1.0rem' },
					})}
				>
					使用其他 Email
				</Button>
				</Stack>
			</DialogContent>
			</Dialog>

		</>
	);
};

export default AuthDialog;
