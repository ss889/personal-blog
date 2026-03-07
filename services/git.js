/**
 * Git Service Module
 * Handles all Git operations for pushing content to GitHub
 */

const { execSync } = require('child_process');
const fs = require('fs');
const { GITHUB_CONFIG, ENV_FILE_PATH, GIT_COMMIT_MESSAGE } = require('../config');

/**
 * Reads the GitHub API token from the .env file
 * @returns {string|null} The GitHub token or null if not found
 */
function getGitHubToken() {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    return null;
  }
  
  const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
  const tokenMatch = envContent.match(/GITHUB_API_TOKEN=(.+)/);
  return tokenMatch ? tokenMatch[1].trim() : null;
}

/**
 * Checks if there are uncommitted changes in the repository
 * @param {string} cwd - Working directory
 * @returns {boolean} True if there are changes to commit
 */
function hasUncommittedChanges(cwd) {
  const status = execSync('git status --porcelain', { cwd, encoding: 'utf8' });
  return status.trim().length > 0;
}

/**
 * Stages all changes in the repository
 * @param {string} cwd - Working directory
 */
function stageAllChanges(cwd) {
  execSync('git add -A', { cwd });
}

/**
 * Creates a commit with the blog update message
 * @param {string} cwd - Working directory
 * @returns {boolean} True if commit was created, false if no changes
 */
function createCommit(cwd) {
  try {
    execSync(`git commit -m "${GIT_COMMIT_MESSAGE}"`, { cwd });
    return true;
  } catch (error) {
    // Commit might fail if no changes, that's ok
    console.log('No new changes to commit');
    return false;
  }
}

/**
 * Sets the remote URL with authentication token
 * @param {string} cwd - Working directory
 * @param {string} token - GitHub API token
 */
function setAuthenticatedRemote(cwd, token) {
  const authUrl = GITHUB_CONFIG.getAuthRepoUrl(token);
  execSync(`git remote set-url origin ${authUrl}`, { cwd });
}

/**
 * Resets the remote URL to remove the token
 * @param {string} cwd - Working directory
 */
function resetRemoteUrl(cwd) {
  const publicUrl = GITHUB_CONFIG.getRepoUrl();
  execSync(`git remote set-url origin ${publicUrl}`, { cwd });
}

/**
 * Pushes changes to the remote repository
 * @param {string} cwd - Working directory
 */
function pushToRemote(cwd) {
  execSync(`git push origin ${GITHUB_CONFIG.branch}`, { cwd, encoding: 'utf8' });
}

/**
 * Result of a push operation
 * @typedef {Object} PushResult
 * @property {boolean} success - Whether the push was successful
 * @property {boolean} pushed - Whether changes were actually pushed
 * @property {string|null} error - Error message if failed
 */

/**
 * Pushes blog content changes to GitHub
 * @param {string} cwd - Working directory (repository root)
 * @returns {PushResult} Result of the push operation
 */
function pushToGitHub(cwd) {
  const token = getGitHubToken();
  
  if (!token) {
    return {
      success: false,
      pushed: false,
      error: 'No GitHub token found in .env'
    };
  }

  try {
    if (!hasUncommittedChanges(cwd)) {
      console.log('No changes to push');
      return { success: true, pushed: true, error: null };
    }

    stageAllChanges(cwd);
    createCommit(cwd);
    
    // Set authenticated remote, push, then reset
    setAuthenticatedRemote(cwd, token);
    pushToRemote(cwd);
    resetRemoteUrl(cwd);

    console.log('✓ Auto-pushed to GitHub successfully!');
    return { success: true, pushed: true, error: null };
  } catch (error) {
    // Always try to reset the remote URL even on error
    try {
      resetRemoteUrl(cwd);
    } catch (resetError) {
      // Ignore reset errors
    }
    
    console.error('Auto-push error:', error.message);
    return { success: false, pushed: false, error: error.message };
  }
}

module.exports = {
  getGitHubToken,
  hasUncommittedChanges,
  pushToGitHub
};
