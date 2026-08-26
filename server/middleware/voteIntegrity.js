const { sha256Hash } = require('../config/encryption');

/**
 * Generate vote integrity hash
 * @param {string} voterId
 * @param {string} candidateId
 * @param {string} electionId
 * @param {Date} timestamp
 * @returns {string} SHA-256 hash
 */
const generateVoteHash = (voterId, candidateId, electionId, timestamp) => {
  const data = `${voterId}:${candidateId}:${electionId}:${timestamp}`;
  return sha256Hash(data);
};

/**
 * Verify vote integrity hash
 * @param {object} vote - Vote document
 * @returns {boolean}
 */
const verifyVoteHash = (vote) => {
  const expectedHash = generateVoteHash(
    vote.voterId.toString(),
    vote.candidateId.toString(),
    vote.electionId.toString(),
    vote.timestamp.toISOString()
  );
  return expectedHash === vote.integrityHash;
};

module.exports = { generateVoteHash, verifyVoteHash };
