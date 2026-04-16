import {
  BufferGeometry,
  Float32BufferAttribute,
} from 'three';

import {
  FACE_MESH_INDEX_BUFFER,
  FACE_MESH_UV,
} from './face_geom';

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * MediaPipe uses different convention for axis than Three.js.
 * This function adapts mediapipe landmarks for three.js.
 */
export const transformLandmarks = (landmarks: Landmark[] | undefined): Landmark[] | undefined => {
  if (!landmarks) {
    return landmarks;
  }

  const hasVisibility = !!landmarks.find((l) => l.visibility);

  let minZ = 1e-4;

  if (hasVisibility) {
    landmarks.forEach((landmark) => {
      let { z, visibility } = landmark;
      z = -z;
      if (z < minZ && visibility) {
        minZ = z;
      }
    });
  } else {
    minZ = Math.max(-landmarks[234].z, -landmarks[454].z);
  }

  return landmarks.map((landmark) => {
    const { x, y, z } = landmark;
    return {
      x: -0.5 + x,
      y: 0.5 - y,
      z: -z - minZ,
      visibility: landmark.visibility,
    };
  });
};

/**
 * Scales landmark by width and height
 */
export const scaleLandmark = (landmark: Landmark, width: number, height: number): Landmark => {
  const { x, y, z } = landmark;
  return {
    ...landmark,
    x: x * width,
    y: y * height,
    z: z * width,
  };
};

/**
 * Makes buffer geometry from facemesh landmarks
 */
export const makeGeometry = (landmarks: Landmark[]): BufferGeometry => {
  const geometry = new BufferGeometry();

  const vertices: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i < 468; i++) {
    const { x, y, z } = landmarks[i];
    vertices.push(x, y, z);
  }

  for (let j = 0; j < 468; j++) {
    uvs[j * 2] = FACE_MESH_UV[j][0];
    uvs[j * 2 + 1] = FACE_MESH_UV[j][1];
  }

  geometry.setIndex(FACE_MESH_INDEX_BUFFER);
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
};