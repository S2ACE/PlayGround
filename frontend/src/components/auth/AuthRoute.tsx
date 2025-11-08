import { useState, type JSX } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthRoute = (): JSX.Element => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="authentication tabs"
                    centered
                >
                    <Tab label="登入" />
                    <Tab label="註冊" />
                </Tabs>
            </Box>
            
            {tabValue === 0 && <LoginForm />}
            {tabValue === 1 && <RegisterForm />}
        </Box>
    );
};

export default AuthRoute;
