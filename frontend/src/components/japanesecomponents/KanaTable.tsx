import { Grid, Box } from '@mui/material';
import { useState, useMemo, useCallback, type JSX } from 'react';
import { kanaRows, voicedKanaRows, youonKanaRows } from '../../data/kanaData';
import Header from './Header';
import KanaDialog from './KanaDialog';
import KanaToggle from './KanaToggle';
import KanaGridCell from './KanaGridCell';
import { useParams } from 'react-router-dom';
import type { Kana } from '../../data/kanaData';

const KanaTable = (): JSX.Element => {
  const { type } = useParams();
  let rawKanaData: Kana[][];
  let initialGridColumns = 5;
  let initialInteractive = true;

  switch (type) {
    case 'seion':
      rawKanaData = kanaRows;
      initialGridColumns = 5;
      initialInteractive = true;
      break;
    case 'dakuon&handakuon':
      rawKanaData = voicedKanaRows;
      initialGridColumns = 5;
      initialInteractive = true;
      break;
    case 'youon':
      rawKanaData = youonKanaRows;
      initialGridColumns = 3;
      initialInteractive = false;
      break;
    default:
      rawKanaData = kanaRows;
      initialGridColumns = 5;
      initialInteractive = true;
  }

  const [kanaType, setKanaType] = useState<'hiragana' | 'katakana'>('hiragana');
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);

  const gridColumns = initialGridColumns;
  const isInteractive = initialInteractive;
  const kanaData = rawKanaData;

  // 用 useCallback 確保 reference 穩定
  const handleClick = useCallback(
    (rowIdx: number, colIdx: number) => {
      if (!isInteractive) return;
      const char = kanaData[rowIdx][colIdx][kanaType];
      if (!char) return;
      setSelectedRow(rowIdx);
      setSelectedCol(colIdx);
      setOpen(true);
    },
    [isInteractive, kanaData, kanaType]
  );

  // 表格 JSX 做 memo，只在依賴變時重建
  const kanaGrid = useMemo(
    () => (
      <Box sx={{ mt: 0 }}>
        {kanaData.map((row, rowIndex) => (
          <Grid container columns={gridColumns} key={rowIndex}>
            {row.map((kana, colIndex) => {
              const char = kana[kanaType];
              const romaji = kana.romaji;
              return (
                <KanaGridCell
                  key={colIndex}
                  char={char}
                  romaji={romaji}
                  onClick={() => handleClick(rowIndex, colIndex)}
                  gridColumns={gridColumns}
                  isInteractive={isInteractive}
                />
              );
            })}
          </Grid>
        ))}
      </Box>
    ),
    [kanaData, gridColumns, kanaType, isInteractive, handleClick]
  );

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

  const allKanaPositions = useMemo(
    () =>
      kanaData
        .flatMap((row, rowIdx) =>
          row
            .map((kana, colIdx) => (kana[kanaType] ? [rowIdx, colIdx] : null))
            .filter(Boolean)
        ) as [number, number][],
    [kanaData, kanaType]
  );

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
        <Header title={type} />
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <KanaToggle kanaType={kanaType} setKanaType={setKanaType} />
        </Box>

        {kanaGrid}
      </Box>

      <KanaDialog
        open={open}
        kana={selectedKana}
        romaji={selectedKanaRomaji}
        onClose={() => setOpen(false)}
        isFirst={isFirst}
        isLast={isLast}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </>
  );
};

export default KanaTable;