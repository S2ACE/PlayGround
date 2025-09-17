import './App.css'
import NavigationBar from './components/NavigationBar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PageLayout from './components/PageLayout';

import WordGuess from './components/gamecomponents/WordGuess'
import KanaTable from './components/japanesecomponents/KanaTable'

function App() {
  return (
    <BrowserRouter>
      <NavigationBar />
      <PageLayout>
        <Routes>
          <Route path="/wordguess" element={<WordGuess />} />
          <Route path="/kanatable/:type" element={<KanaTable />} />
          {/* 你可以在這裡加其他頁面 */}
          {/* <Route path="/about" element={<About />} /> */}
        </Routes>
      </PageLayout>
    </BrowserRouter>
  );
}

export default App;
