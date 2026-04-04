const fs = require('fs');

function fixLocale(path) {
    let content = fs.readFileSync(path, 'utf8');

    // Fix departments list
    content = content.replace(
        /("folk": ".*?")\s*},/g,
        '$1\n\t\t}\n\t},'
    );

    // Fix admission duplicate body
    content = content.replace(
        /("admission":\s*{\s*"title":\s*".*?",\s*)"body":\s*"[\s\S]*?",\s*"body":\s*"([\s\S]*?)"/g,
        '$1"body": "$2"'
    );
    
    // Fix missing closing brace for admission before seo
    if (content.includes('"admission":') && content.includes('"seo":')) {
        const parts = content.split('"seo":');
        if (!parts[0].trim().endsWith('},')) {
             parts[0] = parts[0].trimEnd();
             // Find last key in admission
             if (!parts[0].endsWith('}')) {
                 parts[0] += '\n\t},\n\t';
             } else {
                 parts[0] += ',\n\t';
             }
             content = parts.join('"seo":');
        }
    }

    // Ensure it ends with a brace
    content = content.trim();
    if (!content.endsWith('}')) {
        content += '\n}';
    }
    
    fs.writeFileSync(path, content);
}

fixLocale('src/lib/i18n/locales/uk.json');
fixLocale('src/lib/i18n/locales/en.json');
