const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = __dirname;

async function run() {
  const repo = { fs, dir };
  
  console.log('Reading status matrix...');
  const matrix = await git.statusMatrix(repo);
  
  let hasChanges = false;
  for (const [filepath, head, workdir, stage] of matrix) {
    // We ignore node_modules and .git automatically because statusMatrix respects .gitignore,
    // but isomorphic-git does status checks.
    if (workdir !== stage) {
      hasChanges = true;
      if (workdir === 0) {
        await git.remove({ ...repo, filepath });
        console.log(`Staged removal: ${filepath}`);
      } else {
        await git.add({ ...repo, filepath });
        console.log(`Staged addition/modification: ${filepath}`);
      }
    }
  }

  if (!hasChanges) {
    console.log('No changes to commit.');
  } else {
    const sha = await git.commit({
      ...repo,
      message: 'Update codebase with optimizations and fixes',
      author: {
        name: 'kaviyarasukav',
        email: 'kaviyarasukav@github.com'
      }
    });
    console.log(`Committed changes: ${sha}`);
  }

  const token = process.argv[2];
  if (!token) {
    console.log('\n--- GIT UPDATE COMPLETE LOCALLY ---');
    console.log('To push to GitHub, please run:');
    console.log('node push-code.cjs <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>');
    return;
  }

  console.log('Pushing to GitHub remote (origin)...');
  try {
    const pushResult = await git.push({
      ...repo,
      http,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({ username: 'kaviyarasukav', password: token }),
    });
    console.log('Push completed successfully!', pushResult);
  } catch (err) {
    console.error('Push failed:', err.message);
  }
}

run().catch(console.error);
