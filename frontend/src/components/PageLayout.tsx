import { Box, Toolbar } from "@mui/material";

const PageLayout = ({ children }: { children: React.ReactNode }) => (
    <Box
        sx={{
            backgroundColor: '#242424',
            color: 'white',
            width: '100%',
            minHeight: '100vh',
            overflow: 'auto',
            px: 2,
            boxSizing: 'border-box',
        }}
    >
        <Toolbar /> {/* 這裡推開內容 */}
        {children}
    </Box>
);

export default PageLayout;