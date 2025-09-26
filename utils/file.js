import fs from 'fs/promises';
import path from 'path';

export async function safeUnlink(baseDir, filename) {
    if (!filename) return;
    const full = path.join(baseDir, path.basename(filename));
    await fs.rm(full, { force: true });
}

