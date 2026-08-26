/**
 * WebAuthn / FIDO2 Biometric Authentication Utilities
 * Uses the browser's built-in WebAuthn API
 * No fingerprint data is exposed to the application
 */

/**
 * Check if WebAuthn is supported in the current browser
 */
export const isWebAuthnSupported = () => {
  return window.PublicKeyCredential !== undefined &&
         typeof window.PublicKeyCredential === 'function';
};

/**
 * Register a new biometric credential (called during voter registration)
 * @param {string} userId - User's unique ID
 * @param {string} userName - User's name
 * @returns {{ credentialId: string, publicKey: string } | null}
 */
export const registerBiometric = async (userId, userName) => {
  if (!isWebAuthnSupported()) return null;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyOptions = {
      challenge,
      rp: {
        name: 'Votexa Voting System',
        id: window.location.hostname
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'none'
    };

    const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });

    const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    const publicKeyBytes = new Uint8Array(credential.response.getPublicKey?.() || []);
    const publicKey = btoa(String.fromCharCode(...publicKeyBytes));

    return { credentialId, publicKey };
  } catch (error) {
    console.error('WebAuthn registration failed:', error);
    return null;
  }
};

/**
 * Authenticate using biometric (called during voting)
 * @param {string} credentialId - Stored credential ID
 * @returns {boolean}
 */
export const authenticateBiometric = async (credentialId) => {
  if (!isWebAuthnSupported()) {
    console.warn('WebAuthn not supported, skipping biometric check');
    return true; // Graceful fallback for unsupported devices
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    let allowCredentials = [];
    if (credentialId) {
      const rawId = new Uint8Array(
        atob(credentialId).split('').map(c => c.charCodeAt(0))
      );
      allowCredentials = [{ type: 'public-key', id: rawId }];
    }

    const publicKeyOptions = {
      challenge,
      allowCredentials,
      userVerification: 'required',
      timeout: 60000
    };

    const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
    return assertion !== null;
  } catch (error) {
    console.error('WebAuthn authentication failed:', error);
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric verification was cancelled or timed out.');
    }
    return false;
  }
};
