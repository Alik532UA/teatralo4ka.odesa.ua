import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { validatePageMetadata } from '../i18n/schema';

const PAGES_DIR = path.join(process.cwd(), 'src/lib/i18n/pages');
const SUPPORTED_LANGS = ['uk', 'en'];

function validateAll() {
  let hasErrors = false;

  console.log('🔍 Starting content validation...');

  for (const lang of SUPPORTED_LANGS) {
    const langDir = path.join(PAGES_DIR, lang);
    if (!fs.existsSync(langDir)) continue;

    const files = fs.readdirSync(langDir).filter((f: string) => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(langDir, file);

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      try {
        validatePageMetadata(data);
        if (!content.trim()) {
          throw new Error('Content is empty');
        }
        console.log(`✅ Valid: ${lang}/${file}`);
      } catch (error: any) {
        console.error(`❌ Invalid: ${lang}/${file}`);
        console.error(`   Reason: ${error.message}`);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log('🎉 All content is valid!');
  }
}

validateAll();
