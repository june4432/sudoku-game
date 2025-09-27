import React, { useState, useEffect } from 'react';
import './App.css';

type Cell = {
  value: number | null;
  isFixed: boolean;
  isError: boolean;
  isHint: boolean;
  memos: Set<number>;
};

type Board = Cell[][];

const App: React.FC = () => {
  const [board, setBoard] = useState<Board>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(5);
  const [gameWon, setGameWon] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium'>('easy');
  const [isMemoMode, setIsMemoMode] = useState(false);

  const generateSudoku = (difficulty: 'easy' | 'medium'): Board => {
    const solution = generateCompleteSudoku();
    const puzzle = createPuzzle(solution, difficulty === 'easy' ? 45 : 35);

    return puzzle.map((row, rowIndex) =>
      row.map((value, colIndex) => ({
        value: value === 0 ? null : value,
        isFixed: value !== 0,
        isError: false,
        isHint: false,
        memos: new Set<number>(),
      }))
    );
  };

  const generateCompleteSudoku = (): number[][] => {
    // 더 안정적인 스도쿠 생성
    const board = Array(9).fill(null).map(() => Array(9).fill(0));

    // 기본 패턴으로 시작
    const basePattern = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 4, 5, 6, 7, 8, 9, 1],
      [5, 6, 7, 8, 9, 1, 2, 3, 4],
      [8, 9, 1, 2, 3, 4, 5, 6, 7],
      [3, 4, 5, 6, 7, 8, 9, 1, 2],
      [6, 7, 8, 9, 1, 2, 3, 4, 5],
      [9, 1, 2, 3, 4, 5, 6, 7, 8]
    ];

    // 기본 패턴을 복사
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        board[i][j] = basePattern[i][j];
      }
    }

    // 랜덤하게 섮기 (행 섮기)
    for (let i = 0; i < 50; i++) {
      const row1 = Math.floor(Math.random() / 3) * 3 + Math.floor(Math.random() * 3);
      const row2 = Math.floor(row1 / 3) * 3 + Math.floor(Math.random() * 3);
      if (row1 !== row2) {
        [board[row1], board[row2]] = [board[row2], board[row1]];
      }
    }

    // 랜덤하게 섮기 (열 섮기)
    for (let i = 0; i < 50; i++) {
      const col1 = Math.floor(Math.random() / 3) * 3 + Math.floor(Math.random() * 3);
      const col2 = Math.floor(col1 / 3) * 3 + Math.floor(Math.random() * 3);
      if (col1 !== col2) {
        for (let row = 0; row < 9; row++) {
          [board[row][col1], board[row][col2]] = [board[row][col2], board[row][col1]];
        }
      }
    }

    // 숫자 치환
    for (let i = 0; i < 20; i++) {
      const num1 = Math.floor(Math.random() * 9) + 1;
      const num2 = Math.floor(Math.random() * 9) + 1;
      if (num1 !== num2) {
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (board[row][col] === num1) {
              board[row][col] = num2;
            } else if (board[row][col] === num2) {
              board[row][col] = num1;
            }
          }
        }
      }
    }

    return board;
  };

  const createPuzzle = (solution: number[][], cellsToShow: number): number[][] => {
    const puzzle = solution.map(row => [...row]);
    let cellsToRemove = 81 - cellsToShow;

    while (cellsToRemove > 0) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);

      if (puzzle[row][col] !== 0) {
        puzzle[row][col] = 0;
        cellsToRemove--;
      }
    }

    return puzzle;
  };

  const initGame = () => {
    setBoard(generateSudoku(difficulty));
    setMistakes(0);
    setHints(5);
    setGameWon(false);
    setShowCelebration(false);
    setSelectedCell(null);
    setIsMemoMode(false);
  };

  useEffect(() => {
    initGame();
  }, [difficulty]);

  const handleCellClick = (row: number, col: number) => {
    if (!board[row][col].isFixed) {
      setSelectedCell([row, col]);
    }
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || gameWon) return;

    const [row, col] = selectedCell;
    if (board[row][col].isFixed) return;

    const newBoard = board.map(r => r.map(c => ({
      ...c,
      memos: new Set(c.memos)
    })));

    if (isMemoMode) {
      // 메모 모드에서는 숫자를 토글
      if (newBoard[row][col].memos.has(num)) {
        newBoard[row][col].memos.delete(num);
      } else {
        newBoard[row][col].memos.add(num);
      }
      // 메모 추가 시 기존 값 제거
      if (newBoard[row][col].value !== null) {
        newBoard[row][col].value = null;
        newBoard[row][col].isError = false;
        newBoard[row][col].isHint = false;
      }
    } else {
      // 일반 모드에서는 값 입력
      newBoard[row][col].value = num;
      newBoard[row][col].isHint = false;
      newBoard[row][col].memos.clear(); // 값 입력 시 메모 제거

      const isError = !isValidMove(newBoard, row, col, num);
      newBoard[row][col].isError = isError;

      if (isError) {
        setMistakes(mistakes + 1);
      }
    }

    setBoard(newBoard);

    if (!isMemoMode && checkWin(newBoard)) {
      setGameWon(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const handleClear = () => {
    if (!selectedCell || gameWon) return;

    const [row, col] = selectedCell;
    if (board[row][col].isFixed) return;

    const newBoard = board.map(r => r.map(c => ({
      ...c,
      memos: new Set(c.memos)
    })));
    newBoard[row][col].value = null;
    newBoard[row][col].isError = false;
    newBoard[row][col].isHint = false;
    newBoard[row][col].memos.clear();
    setBoard(newBoard);
  };

  const handleHint = () => {
    if (!selectedCell || hints <= 0 || gameWon) return;

    const [row, col] = selectedCell;
    if (board[row][col].isFixed || board[row][col].value !== null) return;

    const solution = generateCompleteSudoku();
    const correctValue = findCorrectValue(row, col);

    if (correctValue) {
      const newBoard = board.map(r => r.map(c => ({ ...c })));
      newBoard[row][col].value = correctValue;
      newBoard[row][col].isHint = true;
      newBoard[row][col].isError = false;
      setBoard(newBoard);
      setHints(hints - 1);

      if (checkWin(newBoard)) {
        setGameWon(true);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
  };

  const findCorrectValue = (row: number, col: number): number => {
    // 현재 보드 상태를 숫자 배열로 변환
    const currentBoard = board.map(r => r.map(c => c.value || 0));

    // 백트래킹으로 해를 구함
    const solution = solveSudoku([...currentBoard.map(r => [...r])]);

    if (solution && solution[row][col] !== 0) {
      return solution[row][col];
    }

    // 해가 없으면 유효한 첫 번째 숫자 반환
    for (let num = 1; num <= 9; num++) {
      if (isValidMove(board, row, col, num)) {
        return num;
      }
    }
    return 1;
  };

  const solveSudoku = (board: number[][]): number[][] | null => {
    const solve = (board: number[][]): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (isValidForSolution(board, row, col, num)) {
                board[row][col] = num;
                if (solve(board)) return true;
                board[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    const boardCopy = board.map(row => [...row]);
    if (solve(boardCopy)) {
      return boardCopy;
    }
    return null;
  };

  const canCompleteSudoku = (board: Board): boolean => {
    const numBoard = board.map(row => row.map(cell => cell.value || 0));

    const solve = (board: number[][]): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (isValidForSolution(board, row, col, num)) {
                board[row][col] = num;
                if (solve(board)) return true;
                board[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    return solve(numBoard);
  };

  const isValidForSolution = (board: number[][], row: number, col: number, num: number): boolean => {
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
      if (board[x][col] === num) return false;
    }

    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  };

  const isValidMove = (board: Board, row: number, col: number, num: number): boolean => {
    for (let x = 0; x < 9; x++) {
      if (x !== col && board[row][x].value === num) return false;
    }

    for (let x = 0; x < 9; x++) {
      if (x !== row && board[x][col].value === num) return false;
    }

    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if ((i + startRow !== row || j + startCol !== col) &&
            board[i + startRow][j + startCol].value === num) {
          return false;
        }
      }
    }

    return true;
  };

  const checkWin = (board: Board): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (!board[row][col].value || board[row][col].isError) {
          return false;
        }
      }
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 p-2 md:p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-center text-white mb-3 md:mb-6 drop-shadow-lg">
          🎮 스도쿠 게임 🌟
        </h1>

        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="text-8xl animate-bounce">🎉</div>
            <div className="text-8xl animate-bounce animation-delay-100">🎊</div>
            <div className="text-8xl animate-bounce animation-delay-200">🏆</div>
          </div>
        )}

        <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-3 md:p-6 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 gap-3">
            <div className="flex gap-2 md:gap-4">
              <button
                onClick={() => setDifficulty('easy')}
                className={`px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-full font-bold transition-all transform hover:scale-105 ${
                  difficulty === 'easy'
                    ? 'bg-green-400 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                🌱 쉬움
              </button>
              <button
                onClick={() => setDifficulty('medium')}
                className={`px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-full font-bold transition-all transform hover:scale-105 ${
                  difficulty === 'medium'
                    ? 'bg-orange-400 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                🌳 보통
              </button>
            </div>

            <div className="flex gap-4 md:gap-6">
              <div className="text-sm md:text-lg font-bold">
                ❌ 실수: <span className="text-red-500">{mistakes}</span>/3
              </div>
              <div className="text-sm md:text-lg font-bold">
                💡 힌트: <span className="text-blue-500">{hints}</span>
              </div>
            </div>
          </div>

          {gameWon && (
            <div className="text-center mb-4 p-4 bg-yellow-100 rounded-2xl">
              <p className="text-3xl font-bold text-yellow-600">
                🏆 축하해요! 성공했어요! 🏆
              </p>
            </div>
          )}

          {mistakes >= 3 && !gameWon && (
            <div className="text-center mb-4 p-4 bg-red-100 rounded-2xl">
              <p className="text-2xl font-bold text-red-600">
                😢 아쉬워요! 다시 도전해보세요!
              </p>
            </div>
          )}

          <div className="grid grid-cols-9 gap-0 mx-auto w-fit max-w-full border-[3px] md:border-4 border-purple-500 rounded-lg md:rounded-xl overflow-hidden shadow-xl">
            {board.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 border border-gray-300 flex items-center justify-center cursor-pointer
                    text-base sm:text-xl md:text-2xl font-bold transition-all transform md:hover:scale-105
                    ${(rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? 'border-b-[3px] md:border-b-4 border-b-purple-500' : ''}
                    ${(colIndex + 1) % 3 === 0 && colIndex !== 8 ? 'border-r-[3px] md:border-r-4 border-r-purple-500' : ''}
                    ${selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex
                      ? 'bg-yellow-200 shadow-inner'
                      : 'hover:bg-blue-100'}
                    ${cell.isFixed ? 'bg-gray-100 text-gray-800' : 'bg-white'}
                    ${cell.isError ? 'text-red-500 bg-red-50' : ''}
                    ${cell.isHint ? 'text-green-600 bg-green-50' : ''}
                    ${!cell.isFixed && !cell.isError && !cell.isHint ? 'text-blue-600' : ''}
                  `}
                >
                  {cell.value ? (
                    <span className="">{cell.value}</span>
                  ) : cell.memos.size > 0 ? (
                    <div className="grid grid-cols-3 gap-0 w-full h-full text-[0.4rem] sm:text-[0.5rem] md:text-xs text-gray-500 font-normal">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(memoNum => (
                        <div key={memoNum} className="flex items-center justify-center">
                          {cell.memos.has(memoNum) ? memoNum : ''}
                        </div>
                      ))}
                    </div>
                  ) : (
                    ''
                  )}
                </div>
              ))
            ))}
          </div>

          <div className="mt-4 md:mt-8">
            <div className="grid grid-cols-5 gap-2 md:gap-3 max-w-md mx-auto px-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumberInput(num)}
                  className="bg-gradient-to-r from-blue-400 to-purple-400 text-white text-lg sm:text-xl md:text-2xl font-bold py-3 px-3 sm:py-4 sm:px-6 rounded-xl md:rounded-2xl shadow-lg transition-all transform hover:scale-110 hover:rotate-3 active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-lg md:text-xl font-bold py-3 px-3 sm:py-4 sm:px-4 rounded-xl md:rounded-2xl shadow-lg transition-all transform hover:scale-110 active:scale-95"
              >
                🗑️
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mt-4 md:mt-6">
              <button
                onClick={() => setIsMemoMode(!isMemoMode)}
                className={`px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-xl shadow-lg transition-all transform hover:scale-105 ${
                  isMemoMode
                    ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                    : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                }`}
              >
                ✏️ {isMemoMode ? '메모 모드' : '숫자 모드'}
              </button>
              <button
                onClick={handleHint}
                disabled={hints <= 0 || isMemoMode}
                className={`px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-xl shadow-lg transition-all transform hover:scale-105 ${
                  hints > 0 && !isMemoMode
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                💡 힌트 사용
              </button>

              <button
                onClick={initGame}
                className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-xl md:rounded-2xl font-bold text-base md:text-xl shadow-lg transition-all transform hover:scale-105 hover:from-green-500 hover:to-blue-500"
              >
                🎲 새 게임
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 shadow-xl">
          <h2 className="text-lg md:text-2xl font-bold text-purple-600 mb-2 md:mb-3">🎯 게임 방법</h2>
          <ul className="space-y-1 md:space-y-2 text-sm md:text-lg">
            <li className="flex items-start">
              <span className="mr-2">📝</span>
              <span>1~9까지 숫자를 빈 칸에 넣어요</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">↔️</span>
              <span>가로줄에 같은 숫자가 두 번 나오면 안돼요</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">↕️</span>
              <span>세로줄에도 같은 숫자가 두 번 나오면 안돼요</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⬜</span>
              <span>3x3 박스 안에도 같은 숫자가 두 번 나오면 안돼요</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">💡</span>
              <span>어려우면 힌트를 사용해보세요!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;