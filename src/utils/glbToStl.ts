export async function convertGlbToStl(glbUrl: string): Promise<Blob> {
  const response = await fetch(glbUrl);
  const arrayBuffer = await response.arrayBuffer();

  const glbData = parseGlb(arrayBuffer);
  const stlData = generateStl(glbData);

  return new Blob([stlData], { type: 'application/octet-stream' });
}

interface GlbData {
  vertices: Float32Array[];
  indices: Uint16Array[] | Uint32Array[];
}

function parseGlb(arrayBuffer: ArrayBuffer): GlbData {
  const dataView = new DataView(arrayBuffer);

  const magic = dataView.getUint32(0, true);
  if (magic !== 0x46546C67) {
    throw new Error('Invalid GLB file');
  }

  const version = dataView.getUint32(4, true);
  const length = dataView.getUint32(8, true);

  let offset = 12;
  let jsonChunk: any = null;
  let binaryChunk: ArrayBuffer | null = null;

  while (offset < length) {
    const chunkLength = dataView.getUint32(offset, true);
    const chunkType = dataView.getUint32(offset + 4, true);
    const chunkData = arrayBuffer.slice(offset + 8, offset + 8 + chunkLength);

    if (chunkType === 0x4E4F534A) {
      const decoder = new TextDecoder('utf-8');
      jsonChunk = JSON.parse(decoder.decode(chunkData));
    } else if (chunkType === 0x004E4942) {
      binaryChunk = chunkData;
    }

    offset += 8 + chunkLength;
  }

  if (!jsonChunk || !binaryChunk) {
    throw new Error('Invalid GLB structure');
  }

  const vertices: Float32Array[] = [];
  const indices: (Uint16Array | Uint32Array)[] = [];

  const meshes = jsonChunk.meshes || [];

  for (const mesh of meshes) {
    for (const primitive of mesh.primitives) {
      const positionAccessorIndex = primitive.attributes.POSITION;
      const indicesAccessorIndex = primitive.indices;

      if (positionAccessorIndex !== undefined) {
        const positionData = getAccessorData(jsonChunk, binaryChunk, positionAccessorIndex);
        vertices.push(new Float32Array(positionData));
      }

      if (indicesAccessorIndex !== undefined) {
        const indexData = getAccessorData(jsonChunk, binaryChunk, indicesAccessorIndex);
        const accessor = jsonChunk.accessors[indicesAccessorIndex];

        if (accessor.componentType === 5123) {
          indices.push(new Uint16Array(indexData));
        } else if (accessor.componentType === 5125) {
          indices.push(new Uint32Array(indexData));
        }
      }
    }
  }

  return { vertices, indices };
}

function getAccessorData(json: any, binaryChunk: ArrayBuffer, accessorIndex: number): ArrayBuffer {
  const accessor = json.accessors[accessorIndex];
  const bufferView = json.bufferViews[accessor.bufferView];

  const offset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const length = accessor.count * getComponentCount(accessor.type) * getComponentSize(accessor.componentType);

  return binaryChunk.slice(offset, offset + length);
}

function getComponentCount(type: string): number {
  const counts: Record<string, number> = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16,
  };
  return counts[type] || 1;
}

function getComponentSize(componentType: number): number {
  const sizes: Record<number, number> = {
    5120: 1,
    5121: 1,
    5122: 2,
    5123: 2,
    5125: 4,
    5126: 4,
  };
  return sizes[componentType] || 1;
}

function generateStl(glbData: GlbData): ArrayBuffer {
  let triangleCount = 0;

  for (let i = 0; i < glbData.indices.length; i++) {
    triangleCount += Math.floor(glbData.indices[i].length / 3);
  }

  if (triangleCount === 0 && glbData.vertices.length > 0) {
    for (const verts of glbData.vertices) {
      triangleCount += Math.floor(verts.length / 9);
    }
  }

  const headerSize = 80;
  const triangleCountSize = 4;
  const triangleSize = 50;
  const bufferSize = headerSize + triangleCountSize + (triangleCount * triangleSize);

  const buffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(buffer);

  const header = 'Binary STL generated from GLB';
  for (let i = 0; i < Math.min(header.length, 80); i++) {
    dataView.setUint8(i, header.charCodeAt(i));
  }

  dataView.setUint32(80, triangleCount, true);

  let offset = 84;

  for (let meshIndex = 0; meshIndex < glbData.vertices.length; meshIndex++) {
    const vertices = glbData.vertices[meshIndex];
    const indices = glbData.indices[meshIndex];

    if (indices && indices.length > 0) {
      for (let i = 0; i < indices.length; i += 3) {
        if (i + 2 >= indices.length) break;

        const i0 = indices[i] * 3;
        const i1 = indices[i + 1] * 3;
        const i2 = indices[i + 2] * 3;

        if (i0 + 2 >= vertices.length || i1 + 2 >= vertices.length || i2 + 2 >= vertices.length) {
          continue;
        }

        const v1 = [vertices[i0], vertices[i0 + 1], vertices[i0 + 2]];
        const v2 = [vertices[i1], vertices[i1 + 1], vertices[i1 + 2]];
        const v3 = [vertices[i2], vertices[i2 + 1], vertices[i2 + 2]];

        const normal = calculateNormal(v1, v2, v3);

        dataView.setFloat32(offset, normal[0], true);
        dataView.setFloat32(offset + 4, normal[1], true);
        dataView.setFloat32(offset + 8, normal[2], true);
        offset += 12;

        dataView.setFloat32(offset, v1[0], true);
        dataView.setFloat32(offset + 4, v1[1], true);
        dataView.setFloat32(offset + 8, v1[2], true);
        offset += 12;

        dataView.setFloat32(offset, v2[0], true);
        dataView.setFloat32(offset + 4, v2[1], true);
        dataView.setFloat32(offset + 8, v2[2], true);
        offset += 12;

        dataView.setFloat32(offset, v3[0], true);
        dataView.setFloat32(offset + 4, v3[1], true);
        dataView.setFloat32(offset + 8, v3[2], true);
        offset += 12;

        dataView.setUint16(offset, 0, true);
        offset += 2;
      }
    } else {
      for (let i = 0; i < vertices.length; i += 9) {
        if (i + 8 >= vertices.length) break;

        const v1 = [vertices[i], vertices[i + 1], vertices[i + 2]];
        const v2 = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
        const v3 = [vertices[i + 6], vertices[i + 7], vertices[i + 8]];

        const normal = calculateNormal(v1, v2, v3);

        dataView.setFloat32(offset, normal[0], true);
        dataView.setFloat32(offset + 4, normal[1], true);
        dataView.setFloat32(offset + 8, normal[2], true);
        offset += 12;

        dataView.setFloat32(offset, v1[0], true);
        dataView.setFloat32(offset + 4, v1[1], true);
        dataView.setFloat32(offset + 8, v1[2], true);
        offset += 12;

        dataView.setFloat32(offset, v2[0], true);
        dataView.setFloat32(offset + 4, v2[1], true);
        dataView.setFloat32(offset + 8, v2[2], true);
        offset += 12;

        dataView.setFloat32(offset, v3[0], true);
        dataView.setFloat32(offset + 4, v3[1], true);
        dataView.setFloat32(offset + 8, v3[2], true);
        offset += 12;

        dataView.setUint16(offset, 0, true);
        offset += 2;
      }
    }
  }

  return buffer;
}

function calculateNormal(v1: number[], v2: number[], v3: number[]): number[] {
  const u = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
  const v = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

  const normal = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];

  const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);

  if (length > 0) {
    normal[0] /= length;
    normal[1] /= length;
    normal[2] /= length;
  }

  return normal;
}
