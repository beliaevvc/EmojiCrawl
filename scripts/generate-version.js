import { execSync } from 'child_process';
import fs from 'fs';

try {
  // Get total commit count for build number
  const commitCount = execSync('git rev-list --count HEAD').toString().trim();
  
  // Get git log with format: hash|date|message
  const log = execSync('git log --pretty=format:"%h|%ad|%s" --date=format:"%d.%m.%Y %H:%M" -n 50').toString();
  
  const commits = log.split('\n').map(line => {
    const [hash, date, message] = line.split('|');
    return { hash, date, message };
  }).filter(c => c.hash); // Filter empty lines

  const versionData = {
    version: `0.0.${commitCount}`,
    buildDate: new Date().toLocaleString(),
    commits
  };

  fs.writeFileSync('src/data/version_history.json', JSON.stringify(versionData, null, 2));
  console.log(`✅ Version history generated! Build: v${versionData.version}`);
} catch (e) {
  console.error('❌ Failed to generate version history:', e);
  // Create fallback file
  fs.writeFileSync('src/data/version_history.json', JSON.stringify({ version: 'dev', commits: [] }));
}
