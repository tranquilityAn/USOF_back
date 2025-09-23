const fs = require('fs/promises');
const path = require('path');

async function safeUnlink(baseDir, filename) {
    if (!filename) return;
    const full = path.join(baseDir, path.basename(filename));
    await fs.rm(full, { force: true });
}

module.exports = { safeUnlink };
