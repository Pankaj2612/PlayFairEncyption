import React, { useState, useMemo } from 'react';
import { BookOpen, Key, Lock, LockKeyhole, Unlock, HelpCircle } from 'lucide-react';

// Helper functions for Playfair cipher
const generatePlayfairMatrix = (key: string = "PLAYFAIR") => {
  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // Note: I/J are combined
  const normalizedKey = key
    .toUpperCase()
    .replace(/J/g, 'I')
    .replace(/[^A-Z]/g, '');
  
  let matrix: string[][] = Array(5).fill(null).map(() => Array(5).fill(''));
  let used = new Set();
  
  // Fill with key first
  let row = 0, col = 0;
  for (let char of [...new Set(normalizedKey)]) {
    matrix[row][col] = char;
    used.add(char);
    col++;
    if (col === 5) {
      col = 0;
      row++;
    }
  }
  
  // Fill remaining with unused alphabet letters
  for (let char of alphabet) {
    if (!used.has(char)) {
      if (col === 5) {
        col = 0;
        row++;
      }
      matrix[row][col] = char;
      used.add(char);
      col++;
    }
  }
  
  return matrix;
};

const findPosition = (matrix: string[][], char: string): [number, number] => {
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (matrix[i][j] === char) {
        return [i, j];
      }
    }
  }
  return [-1, -1];
};

const preparePairs = (text: string): string[] => {
  const normalized = text
    .toUpperCase()
    .replace(/J/g, 'I')
    .replace(/[^A-Z]/g, '');
  
  const pairs: string[] = [];
  let i = 0;
  
  while (i < normalized.length) {
    if (i === normalized.length - 1) {
      pairs.push(normalized[i] + 'X');
      break;
    }
    
    if (normalized[i] === normalized[i + 1]) {
      pairs.push(normalized[i] + 'X');
      i++;
    } else {
      pairs.push(normalized[i] + normalized[i + 1]);
      i += 2;
    }
  }
  
  return pairs;
};

const encryptPair = (matrix: string[][], pair: string): string => {
  const [row1, col1] = findPosition(matrix, pair[0]);
  const [row2, col2] = findPosition(matrix, pair[1]);
  
  if (row1 === row2) {
    return matrix[row1][(col1 + 1) % 5] + matrix[row2][(col2 + 1) % 5];
  }
  
  if (col1 === col2) {
    return matrix[(row1 + 1) % 5][col1] + matrix[(row2 + 1) % 5][col2];
  }
  
  return matrix[row1][col2] + matrix[row2][col1];
};

const decryptPair = (matrix: string[][], pair: string): string => {
  const [row1, col1] = findPosition(matrix, pair[0]);
  const [row2, col2] = findPosition(matrix, pair[1]);
  
  if (row1 === row2) {
    return matrix[row1][(col1 + 4) % 5] + matrix[row2][(col2 + 4) % 5];
  }
  
  if (col1 === col2) {
    return matrix[(row1 + 4) % 5][col1] + matrix[(row2 + 4) % 5][col2];
  }
  
  return matrix[row1][col2] + matrix[row2][col1];
};

// Clean up decrypted text by removing padding X's
const cleanDecryptedText = (text: string): string => {
  return text.replace(/X(?=.)/g, '').replace(/X$/, '');
};

function App() {
  const [key, setKey] = useState("PLAYFAIR");
  const [text, setText] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(true);
  const [activeStep, setActiveStep] = useState(-1);
  const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const matrix = useMemo(() => generatePlayfairMatrix(key), [key]);
  const pairs = useMemo(() => preparePairs(text), [text]);
  const processedPairs = useMemo(() => 
    pairs.map(pair => isEncrypting ? encryptPair(matrix, pair) : decryptPair(matrix, pair)),
    [pairs, matrix, isEncrypting]
  );

  const finalText = useMemo(() => {
    const joined = processedPairs.join('');
    return isEncrypting ? joined : cleanDecryptedText(joined);
  }, [processedPairs, isEncrypting]);

  const handlePairHover = (pair: string, idx: number) => {
    setActiveStep(idx);
    const [row1, col1] = findPosition(matrix, pair[0]);
    const [row2, col2] = findPosition(matrix, pair[1]);
    setHighlightedCells([row1 * 5 + col1, row2 * 5 + col2]);
  };

  const handlePairLeave = () => {
    setActiveStep(-1);
    setHighlightedCells([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            Playfair Cipher Visualization
          </h1>
          <p className="text-gray-600">
            Learn how the Playfair cipher works through interactive visualization
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 transform transition-all duration-300 hover:shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  isEncrypting
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setIsEncrypting(true)}
              >
                <Lock className="inline-block w-4 h-4 mr-2" />
                Encrypt
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  !isEncrypting
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setIsEncrypting(false)}
              >
                <Unlock className="inline-block w-4 h-4 mr-2" />
                Decrypt
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="transform transition-all duration-300 hover:scale-102">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="inline mr-2 h-4 w-4" />
                Encryption Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter key..."
              />
            </div>
            <div className="transform transition-all duration-300 hover:scale-102">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="inline mr-2 h-4 w-4" />
                {isEncrypting ? 'Plain Text' : 'Cipher Text'}
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                placeholder={`Enter text to ${isEncrypting ? 'encrypt' : 'decrypt'}...`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-indigo-900">
              Playfair Matrix
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {matrix.map((row, i) =>
                row.map((char, j) => {
                  const index = i * 5 + j;
                  return (
                    <div
                      key={`${i}-${j}`}
                      className={`aspect-square flex items-center justify-center rounded font-mono text-lg transition-all duration-300 transform
                        ${highlightedCells.includes(index) 
                          ? 'bg-indigo-500 text-white scale-110 shadow-lg' 
                          : 'bg-indigo-50'}`}
                    >
                      {char}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-indigo-900">
                {isEncrypting ? 'Encryption' : 'Decryption'} Process
              </h2>
              {isEncrypting && (
                <div 
                  className="relative"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <HelpCircle className="h-5 w-5 text-indigo-500 cursor-help" />
                  {showTooltip && (
                    <div className="absolute right-0 w-64 p-2 mt-2 text-sm text-white bg-gray-800 rounded shadow-lg z-10 animate-fade-in">
                      The letter 'X' is used in two cases:
                      <ul className="list-disc ml-4 mt-1">
                        <li>To complete pairs when the text length is odd</li>
                        <li>To separate identical letters in a pair</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-4">
              {pairs.map((pair, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded transition-all duration-300 transform
                    ${activeStep === idx 
                      ? 'bg-indigo-100 scale-105 shadow-md' 
                      : 'bg-gray-50 hover:bg-gray-100'}`}
                  onMouseEnter={() => handlePairHover(pair, idx)}
                  onMouseLeave={handlePairLeave}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono">{pair}</span>
                    <LockKeyhole className={`h-4 w-4 transition-all duration-300 ${
                      activeStep === idx ? 'text-indigo-600 rotate-12' : 'text-gray-400'
                    }`} />
                    <span className="font-mono">{processedPairs[idx]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-indigo-900">
              {isEncrypting ? (
                <>
                  <Lock className="inline mr-2" />
                  Encrypted Text
                </>
              ) : (
                <>
                  <Unlock className="inline mr-2" />
                  Decrypted Text
                </>
              )}
            </h2>
            <div className="text-lg font-mono bg-indigo-50 p-2 rounded transition-all duration-300 hover:bg-indigo-100">
              {finalText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
