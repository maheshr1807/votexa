import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
let modelsLoaded = false;

/**
 * Load face-api.js models from /public/models
 */
export const loadFaceModels = async () => {
  if (modelsLoaded) return;
  console.log('Loading face recognition models...');
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
  console.log('Face models loaded ✅');
};

/**
 * Get face descriptor from a video or canvas element
 * @param {HTMLVideoElement|HTMLCanvasElement} element
 * @returns {Float32Array|null} 128-d face descriptor
 */
export const getFaceDescriptor = async (element) => {
  const detection = await faceapi
    .detectSingleFace(element, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
};

/**
 * Detect face landmarks from a video element (without descriptor — faster)
 * Returns null if no face found.
 * @param {HTMLVideoElement} videoEl
 * @returns {object|null} { landmarks: faceapi.FaceLandmarks68, detection }
 */
export const detectFaceLandmarks = async (videoEl) => {
  const result = await faceapi
    .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 }))
    .withFaceLandmarks();
  if (!result) return null;
  return { landmarks: result.landmarks, detection: result.detection };
};

// ─── Liveness Helpers ────────────────────────────────────────────────────────

/**
 * Eye Aspect Ratio — measures how open an eye is.
 * EAR < 0.22 generally means the eye is closed (blink).
 *
 * 68-point landmark indices:
 *   Left eye:  [36, 37, 38, 39, 40, 41]
 *   Right eye: [42, 43, 44, 45, 46, 47]
 *
 * @param {Array} pts  Array of {x,y} for the 6 eye points [p1..p6]
 */
function eyeAspectRatio(pts) {
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const vertical1 = dist(pts[1], pts[5]);
  const vertical2 = dist(pts[2], pts[4]);
  const horizontal = dist(pts[0], pts[3]);
  if (horizontal === 0) return 1;
  return (vertical1 + vertical2) / (2 * horizontal);
}

/**
 * Compute average EAR for both eyes from 68-point landmarks.
 * @param {faceapi.FaceLandmarks68} landmarks
 * @returns {number} average EAR (0 = closed, ~0.3 = open)
 */
export const getEyeAspectRatio = (landmarks) => {
  const pts = landmarks.positions; // array of 68 Point {x,y}
  const leftEye  = [pts[36], pts[37], pts[38], pts[39], pts[40], pts[41]];
  const rightEye = [pts[42], pts[43], pts[44], pts[45], pts[46], pts[47]];
  return (eyeAspectRatio(leftEye) + eyeAspectRatio(rightEye)) / 2;
};

/**
 * Estimate head yaw from landmarks.
 * Returns a value roughly in [-1, 1]:
 *   < -0.08 → looking LEFT
 *   >  0.08 → looking RIGHT
 *   ≈ 0     → looking at camera (straight)
 *
 * Method: compare the nose tip horizontal offset relative to the
 *         midpoint of both outer eye corners, normalised by eye span.
 *
 * @param {faceapi.FaceLandmarks68} landmarks
 * @returns {number} yaw estimate
 */
export const getHeadYaw = (landmarks) => {
  const pts = landmarks.positions;
  const leftEyeOuter  = pts[36];  // left outer corner
  const rightEyeOuter = pts[45];  // right outer corner
  const noseTip       = pts[30];

  const eyeCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const eyeSpan    = rightEyeOuter.x - leftEyeOuter.x;
  if (eyeSpan === 0) return 0;
  return (noseTip.x - eyeCenterX) / eyeSpan;
};

/**
 * Analyse current landmarks against a liveness challenge.
 * Returns true when the challenge is satisfied.
 *
 * @param {faceapi.FaceLandmarks68} landmarks
 * @param {'look_left'|'look_right'|'blink'|'look_camera'} challengeType
 * @returns {boolean}
 */
export const checkLivenessChallenge = (landmarks, challengeType) => {
  const yaw  = getHeadYaw(landmarks);
  const ear  = getEyeAspectRatio(landmarks);

  switch (challengeType) {
    case 'look_left':
      // Nose shifts LEFT of eye-center when turning left
      return yaw < -0.10;

    case 'look_right':
      // Nose shifts RIGHT of eye-center when turning right
      return yaw > 0.10;

    case 'blink':
      // EAR drops below 0.22 during a blink
      return ear < 0.22;

    case 'look_camera':
      // Face is roughly straight — nose near center, eyes open
      return Math.abs(yaw) < 0.08 && ear > 0.22;

    default:
      return false;
  }
};

// ─── Challenge Definitions ───────────────────────────────────────────────────

export const ALL_CHALLENGES = [
  { type: 'look_left',   label: 'Look LEFT',          emoji: '👈', hint: 'Turn your head slowly to the left' },
  { type: 'look_right',  label: 'Look RIGHT',          emoji: '👉', hint: 'Turn your head slowly to the right' },
  { type: 'blink',       label: 'Blink your eyes',     emoji: '😉', hint: 'Close and open your eyes once' },
  { type: 'look_camera', label: 'Look at the camera',  emoji: '📷', hint: 'Face straight and look at the camera' },
];

/**
 * Pick N random challenges. Always include look_camera as the last step.
 * @param {number} count  Total challenges (including final look_camera)
 * @returns {Array}
 */
export const pickChallenges = (count = 3) => {
  const pool = ALL_CHALLENGES.filter(c => c.type !== 'look_camera');
  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, count - 1);
  // Always end with "look at camera" to ensure a neutral pose for matching
  chosen.push(ALL_CHALLENGES.find(c => c.type === 'look_camera'));
  return chosen;
};

// ─── Face Matching ────────────────────────────────────────────────────────────

/**
 * Compare two face descriptors
 */
export const compareFaces = (descriptor1, descriptor2, threshold = 0.6) => {
  const d2 = descriptor2 instanceof Float32Array
    ? descriptor2
    : new Float32Array(Object.values(descriptor2));
  const distance = faceapi.euclideanDistance(descriptor1, d2);
  return {
    match: distance < threshold,
    distance: parseFloat(distance.toFixed(4)),
    confidence: Math.max(0, Math.min(100, Math.round((1 - distance) * 100)))
  };
};

/**
 * Convert Float32Array descriptor to a plain array for storage
 */
export const descriptorToArray = (descriptor) => Array.from(descriptor);

/**
 * Convert plain array back to Float32Array
 */
export const arrayToDescriptor = (arr) => new Float32Array(arr);
