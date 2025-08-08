import './App.css'
import WordGuess from './components/gamecomponents/WordGuess'
import NavigationBar from './components/NavigationBar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <NavigationBar />
      <Routes>
        <Route path="/wordguess" element={<WordGuess />} />
        {/* 你可以在這裡加其他頁面 */}
        {/* <Route path="/about" element={<About />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
