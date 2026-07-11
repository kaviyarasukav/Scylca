const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function run() {
    const dir = __dirname;
    
    console.log('Retrieving token from GitHub CLI...');
    let token = '';
    try {
        token = execSync('"' + path.join(dir, 'gh-cli', 'bin', 'gh.exe') + '" auth token', { encoding: 'utf8' }).trim();
        console.log('Token retrieved successfully.');
    } catch (e) {
        console.error('Failed to get token:', e.message);
        process.exit(1);
    }

    console.log('Scanning file status...');
    const statusMatrix = await git.statusMatrix({ fs, dir });
    
    let addedCount = 0;
    let removedCount = 0;

    for (const [filepath, head, workdir, stage] of statusMatrix) {
        // head: 0 (absent), 1 (present)
        // workdir: 0 (absent), 1 (present), 2 (modified/different)
        // stage: 0 (absent), 1 (present), 2 (modified/different)
        
        if (workdir === 2 || (head === 0 && workdir === 1)) {
            // Modified or untracked
            console.log(`Staging: ${filepath}`);
            await git.add({ fs, dir, filepath });
            addedCount++;
        } else if (workdir === 0 && head === 1) {
            // Deleted
            console.log(`Removing: ${filepath}`);
            await git.remove({ fs, dir, filepath });
            removedCount++;
        }
    }

    if (addedCount === 0 && removedCount === 0) {
        console.log('No changes to commit.');
    } else {
        console.log(`Committed files: Added/Modified: ${addedCount}, Removed: ${removedCount}`);
        
        // Commit
        const commitSha = await git.commit({
            fs,
            dir,
            message: 'Sync files from Scylca-AIstudio and commit local changes',
            author: {
                name: 'kaviyarasukav',
                email: 'kaviyarasukav@github.com'
            }
        });
        console.log(`Committed successfully. SHA: ${commitSha}`);
    }

    // Push main -> main
    console.log('Pushing local main to remote main branch...');
    const pushMainRes = await git.push({
        fs,
        http,
        dir,
        remote: 'origin',
        ref: 'main',
        remoteRef: 'main',
        force: true,
        onAuth: () => ({ username: 'x-access-token', password: token })
    });
    console.log('Push to main completed:', JSON.stringify(pushMainRes, null, 2));

    // Push main -> master
    console.log('Pushing local main to remote master branch...');
    const pushMasterRes = await git.push({
        fs,
        http,
        dir,
        remote: 'origin',
        ref: 'main',
        remoteRef: 'master',
        force: true,
        onAuth: () => ({ username: 'x-access-token', password: token })
    });
    console.log('Push to master completed:', JSON.stringify(pushMasterRes, null, 2));
}

run().catch(err => {
    console.error('Git operation failed:', err);
    process.exit(1);
});
