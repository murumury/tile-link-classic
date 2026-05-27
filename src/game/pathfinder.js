function isSamePoint(a, b) {
  return a.row === b.row && a.col === b.col;
}

function inBounds(board, point) {
  return (
    point.row >= 0 &&
    point.row < board.length &&
    point.col >= 0 &&
    point.col < board[0].length
  );
}

function isOpen(board, point) {
  if (!inBounds(board, point)) {
    return true;
  }

  return !board[point.row][point.col].visible;
}

function isPassable(board, point, start, end) {
  return isSamePoint(point, start) || isSamePoint(point, end) || isOpen(board, point);
}

function isStraightClear(board, start, end) {
  if (start.row !== end.row && start.col !== end.col) {
    return false;
  }

  const rowStep = Math.sign(end.row - start.row);
  const colStep = Math.sign(end.col - start.col);
  let cursor = {
    row: start.row + rowStep,
    col: start.col + colStep
  };

  while (!isSamePoint(cursor, end)) {
    if (!isOpen(board, cursor)) {
      return false;
    }

    cursor = {
      row: cursor.row + rowStep,
      col: cursor.col + colStep
    };
  }

  return true;
}

function findOneTurnPath(board, start, end) {
  const corners = [
    { row: start.row, col: end.col },
    { row: end.row, col: start.col }
  ];

  for (const corner of corners) {
    if (
      isPassable(board, corner, start, end) &&
      isStraightClear(board, start, corner) &&
      isStraightClear(board, corner, end)
    ) {
      return [start, corner, end];
    }
  }

  return null;
}

export function findConnection(board, start, end) {
  const first = board[start.row]?.[start.col];
  const second = board[end.row]?.[end.col];

  if (!first || !second || !first.visible || !second.visible) {
    return null;
  }

  if (isSamePoint(start, end) || first.id !== second.id) {
    return null;
  }

  if (isStraightClear(board, start, end)) {
    return [start, end];
  }

  const oneTurnPath = findOneTurnPath(board, start, end);
  if (oneTurnPath) {
    return oneTurnPath;
  }

  const rows = board.length;
  const cols = board[0].length;

  for (let row = -1; row <= rows; row += 1) {
    const pivot = { row, col: start.col };

    if (
      !isSamePoint(pivot, start) &&
      isOpen(board, pivot) &&
      isStraightClear(board, start, pivot)
    ) {
      const path = findOneTurnPath(board, pivot, end);

      if (path) {
        return [start, ...path];
      }
    }
  }

  for (let col = -1; col <= cols; col += 1) {
    const pivot = { row: start.row, col };

    if (
      !isSamePoint(pivot, start) &&
      isOpen(board, pivot) &&
      isStraightClear(board, start, pivot)
    ) {
      const path = findOneTurnPath(board, pivot, end);

      if (path) {
        return [start, ...path];
      }
    }
  }

  return null;
}
