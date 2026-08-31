/** Small authored beeswax candle props for player-placed candle blocks. */
export function buildCandleGeometry(instances, waxTile, flameTile, seed = 0) {
  const positions = []; const normals = []; const colors = []; const uvs = []; const tiles = []; const indices = [];
  const addBox = (cx, cy, cz, sx, sy, sz, tile, tint) => {
    const start = positions.length / 3;
    const verts = [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]];
    const faces = [[0,1,2,3,0,0,1],[1,5,6,2,1,0,0],[5,4,7,6,0,0,-1],[4,0,3,7,-1,0,0],[3,2,6,7,0,1,0],[4,5,1,0,0,-1,0]];
    for (const [x,y,z] of verts) { positions.push(cx + x*sx, cy + y*sy, cz + z*sz); normals.push(0,1,0); colors.push(...tint,1); uvs.push(0.5,0.5); tiles.push(tile); }
    for (const [a,b,c,d,nx,ny,nz] of faces) { normals[(start+a)*3]=nx; normals[(start+a)*3+1]=ny; normals[(start+a)*3+2]=nz; indices.push(start+a,start+b,start+c,start+a,start+c,start+d); }
  };
  for (const origin of instances) {
    const variation = Math.abs(Math.sin(origin.x * 13.1 + origin.z * 17.7 + seed));
    const cx = origin.x + 0.5; const cz = origin.z + 0.5;
    addBox(cx, origin.y + 0.27, cz, 0.16, 0.25 + variation * 0.04, 0.16, waxTile, [1, 0.82, 0.35]);
    addBox(cx, origin.y + 0.62, cz, 0.025, 0.09, 0.025, waxTile, [0.20, 0.12, 0.06]);
    addBox(cx, origin.y + 0.76, cz, 0.09, 0.12, 0.09, flameTile, [1, 0.54 + variation * 0.18, 0.12]);
  }
  return { positions, normals, colors, uvs, tiles, indices, quadCount: indices.length / 6 };
}
