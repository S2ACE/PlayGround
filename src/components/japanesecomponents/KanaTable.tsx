import { Grid, Box } from '@mui/material';
import { useState } from 'react';
import { kanaRows, voicedKanaRows } from '../../data/kanaData';
import type { JSX } from 'react';
import KanaDialog from './KanaDialog';
import KanaToggle from './KanaToggle';
import KanaGridCell from './KanaGridCell';
import KanaNavigation from './KanaNavigation';
import { useParams } from 'react-router-dom';
import type { Kana } from '../../data/kanaData';

const DIALOG_WIDTH = 400;
const ARROW_OFFSET = 30;

const KanaTable = (): JSX.Element => {
  const { type } = useParams();
  let kanaData: Kana[][];

  switch (type) {
    case 'seion':
      kanaData = kanaRows;
      break;
    case 'dakuon&handakuon':
      kanaData = voicedKanaRows;
      break;
    default:
      kanaData = kanaRows;
  }

  
  const [kanaType, setKanaType] = useState<'hiragana' | 'katakana'>('hiragana');
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);

  const handleClick = (rowIdx: number, colIdx: number) => {
    const char = kanaData[rowIdx][colIdx][kanaType];
    if (!char) return;
    setSelectedRow(rowIdx);
    setSelectedCol(colIdx);
    setOpen(true);
  };

  const handlePrev = () => {
    let row = selectedRow;
    let col = selectedCol - 1;
    while (row >= 0) {
      while (col >= 0) {
        if (kanaData[row][col][kanaType]) {
          setSelectedRow(row);
          setSelectedCol(col);
          return;
        }
        col--;
      }
      row--;
      if (row >= 0) col = kanaData[row].length - 1;
    }
  };

  const handleNext = () => {
    let row = selectedRow;
    let col = selectedCol + 1;
    while (row < kanaData.length) {
      while (col < kanaData[row].length) {
        if (kanaData[row][col][kanaType]) {
          setSelectedRow(row);
          setSelectedCol(col);
          return;
        }
        col++;
      }
      row++;
      if (row < kanaData.length) col = 0;
    }
  };

  const allKanaPositions = kanaData.flatMap((row, rowIdx) =>
    row.map((kana, colIdx) => (kana[kanaType] ? [rowIdx, colIdx] : null)).filter(Boolean)
  ) as [number, number][];
  const currentIndex = allKanaPositions.findIndex(
    ([row, col]) => row === selectedRow && col === selectedCol
  );
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === allKanaPositions.length - 1;

  const selectedKana = kanaData[selectedRow]?.[selectedCol]?.[kanaType] || '';
  const selectedKanaRomaji = kanaData[selectedRow]?.[selectedCol]?.romaji || '';

  return (
    <>
      <Box sx={{ maxWidth: 480, mx: 'auto', width: '100%', mt: 4 }}>
        {/* 分頁式 Toggle */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <KanaToggle kanaType={kanaType} setKanaType={setKanaType} />
        </Box>

        {/* 表格區域 */}
        <Box sx={{ mt: 0 }}>
          {kanaData.map((row, rowIndex) => (
            <Grid container columns={5} key={rowIndex}>
              {row.map((kana, colIndex) => {
                const char = kana[kanaType];
                const romaji = kana.romaji;
                return (
                  <KanaGridCell
                    key={colIndex}
                    char={char}
                    romaji={romaji}
                    onClick={() => handleClick(rowIndex, colIndex)}
                  />
                );
              })}
            </Grid>
          ))}
        </Box>
      </Box>


      <KanaDialog
        open={open}
        kana={selectedKana}
        romaji={selectedKanaRomaji}
        onClose={() => setOpen(false)}
      />

      {open && (
        <KanaNavigation
          isFirst={isFirst}
          isLast={isLast}
          onPrev={handlePrev}
          onNext={handleNext}
          dialogWidth={DIALOG_WIDTH}
          offset={ARROW_OFFSET}
        />
      )}
    </>
  );
};

export default KanaTable;
