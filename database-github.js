// Alternative Database System using GitHub API + JSON files
// This is an alternative if you don't want to use Firebase

// Configuration - Update these values
const GITHUB_CONFIG = {
  owner: 'inverted-exe',           // Your GitHub username
  repo: 'inverted-exe.github.io',  // Your repository name
  branch: 'main',                   // Branch name
  token: 'YOUR_GITHUB_TOKEN',       // Get from https://github.com/settings/tokens
  dataFile: 'data/content.json'     // Path to store JSON file
};

// Database utility functions using GitHub API
const DatabaseGitHub = {
  // Get file SHA (needed for updates)
  getFileSha: async (path) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.sha;
      }
      return null;
    } catch (error) {
      console.error('Error getting file SHA:', error);
      return null;
    }
  },

  // Load content from GitHub
  loadContent: async () => {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.dataFile}`
      );
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return { shop: [], archive: [], gallery: [] };
    } catch (error) {
      console.error('Error loading content:', error);
      return { shop: [], archive: [], gallery: [] };
    }
  },

  // Save content to GitHub
  saveContent: async (data) => {
    try {
      const sha = await DatabaseGitHub.getFileSha(GITHUB_CONFIG.dataFile);
      const content = btoa(JSON.stringify(data, null, 2)); // Convert to base64

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataFile}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Update content - ${new Date().toISOString()}`,
            content: content,
            sha: sha,
            branch: GITHUB_CONFIG.branch
          })
        }
      );

      if (response.ok) {
        console.log('Content saved to GitHub');
        return true;
      } else {
        console.error('Failed to save content');
        return false;
      }
    } catch (error) {
      console.error('Error saving content:', error);
      return false;
    }
  },

  // Load specific content type
  loadShop: async () => {
    const data = await DatabaseGitHub.loadContent();
    return data.shop || [];
  },

  loadArchive: async () => {
    const data = await DatabaseGitHub.loadContent();
    return data.archive || [];
  },

  loadGallery: async () => {
    const data = await DatabaseGitHub.loadContent();
    return data.gallery || [];
  },

  // Save specific content type
  saveShop: async (items) => {
    const data = await DatabaseGitHub.loadContent();
    data.shop = items;
    return await DatabaseGitHub.saveContent(data);
  },

  saveArchive: async (items) => {
    const data = await DatabaseGitHub.loadContent();
    data.archive = items;
    return await DatabaseGitHub.saveContent(data);
  },

  saveGallery: async (items) => {
    const data = await DatabaseGitHub.loadContent();
    data.gallery = items;
    return await DatabaseGitHub.saveContent(data);
  }
};
