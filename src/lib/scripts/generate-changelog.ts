import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PAGES_DIR = path.join(process.cwd(), 'src/lib/i18n/pages');

function generateChangelog() {
  console.log('📜 Generating content changelog...');
  let changelog = '# Content Changelog\n\n';

  try {
    const files: string[] = [];
    const langs = ['uk', 'en'];
    
    langs.forEach(lang => {
      const langDir = path.join(PAGES_DIR, lang);
      if (fs.existsSync(langDir)) {
        const mdFiles = fs.readdirSync(langDir).filter((f: string) => f.endsWith('.md'));
        mdFiles.forEach((f: string) => files.push(path.join('src/lib/i18n/pages', lang, f)));
      }
    });

    files.forEach(file => {
      changelog += `## ${file.toUpperCase()}\n\n`;
      try {
        const gitLog = execSync(`git log --follow --pretty=format:"- **%ai** by %an: %s" -- "${file}"`, { encoding: 'utf-8' });
        changelog += gitLog || 'No git history yet.\n';
      } catch (e) {
        changelog += 'Git history not available.\n';
      }
      changelog += '\n\n';
    });

    const outputPath = path.join(process.cwd(), '.private', 'CHANGELOG_CONTENT.md');
    fs.writeFileSync(outputPath, changelog);
    console.log(`✅ Changelog generated at ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to generate changelog:', error);
  }
}

generateChangelog();
