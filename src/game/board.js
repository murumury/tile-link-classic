import { TILE_ASSETS } from "./assets.js";
import { findConnection } from "./pathfinder.js";

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function makeTile(asset, index) {
  return {
    id: asset.id,
    label: asset.label,
    glyph: asset.glyph,
    color: asset.color,
    image: asset.image,
    visible: true,
    matched: false,
    key: `${asset.id}-${index}`
  };
}

export function createBoard(config) {
  const totalTiles = config.rows * config.cols;
  const pairCount = totalTiles / 2;
  const tilePool = [];

  for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
    const asset = TILE_ASSETS[pairIndex % config.assetCount];
    tilePool.push(makeTile(asset, pairIndex * 2));
    tilePool.push(makeTile(asset, pairIndex * 2 + 1));
  }

  const shuffled = shuffle(tilePool);
  const board = [];

  for (let row = 0; row < config.rows; row += 1) {
    board.push(shuffled.slice(row * config.cols, (row + 1) * config.cols));
  }

  return board;
}

export function cloneVisibleTiles(board) {
  return board.flat().filter((tile) => tile.visible);
}

export function countVisibleTiles(board) {
  return cloneVisibleTiles(board).length;
}

export function findAvailableMove(board) {
  const positionsById = new Map();

  board.forEach((rowTiles, row) => {
    rowTiles.forEach((tile, col) => {
      if (!tile.visible) {
        return;
      }

      const positions = positionsById.get(tile.id) ?? [];
      positions.push({ row, col });
      positionsById.set(tile.id, positions);
    });
  });

  for (const positions of positionsById.values()) {
    for (let first = 0; first < positions.length; first += 1) {
      for (let second = first + 1; second < positions.length; second += 1) {
        const path = findConnection(board, positions[first], positions[second]);

        if (path) {
          return {
            first: positions[first],
            second: positions[second],
            path
          };
        }
      }
    }
  }

  return null;
}

export function reshuffleVisibleTiles(board) {
  const visibleTiles = shuffle(cloneVisibleTiles(board));
  let cursor = 0;

  return board.map((rowTiles) =>
    rowTiles.map((tile) => {
      if (!tile.visible) {
        return tile;
      }

      const nextTile = visibleTiles[cursor];
      cursor += 1;
      return nextTile;
    })
  );
}

export function createPlayableBoard(config) {
  let board = createBoard(config);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (findAvailableMove(board)) {
      return board;
    }

    board = reshuffleVisibleTiles(board);
  }

  return board;
}
