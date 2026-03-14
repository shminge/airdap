
export function compare(a, b, threshold = 1.0) {
  const norm = (arr) => {
    const mean = arr.reduce((s, x) => s + x, 0) / arr.length;
    const std = Math.sqrt(arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length);
    return std === 0 ? arr.map(() => 0) : arr.map((x) => (x - mean) / std);
  };

  const na = norm(a);
  const nb = norm(b);

  const N = na.length;
  const M = nb.length;
  const dtw = Array.from({ length: N }, () => new Array(M).fill(Infinity));

  dtw[0][0] = Math.abs(na[0] - nb[0]);
  for (let i = 1; i < N; i++) dtw[i][0] = dtw[i - 1][0] + Math.abs(na[i] - nb[0]);
  for (let j = 1; j < M; j++) dtw[0][j] = dtw[0][j - 1] + Math.abs(na[0] - nb[j]);

  for (let i = 1; i < N; i++)
    for (let j = 1; j < M; j++)
      dtw[i][j] = Math.abs(na[i] - nb[j]) + Math.min(dtw[i-1][j], dtw[i][j-1], dtw[i-1][j-1]);

  const dist = dtw[N - 1][M - 1] / (N + M - 1);

  console.log(dist);

  return dist <= threshold;
}