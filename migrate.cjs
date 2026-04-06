const fs = require('fs');

let content = fs.readFileSync('.read_for_AI/2026-04-05-CLs3.md', 'utf8');

// Базові заміни термінів
content = content.replace(/мистецьких шкіл/g, 'незалежних проєктів (організацій, шкіл, студій тощо)');
content = content.replace(/шкіл\b/g, 'проєктів');
content = content.replace(/школи\b/g, 'проєкту');
content = content.replace(/школу\b/g, 'проєкт');
content = content.replace(/школі\b/g, 'проєкті');
content = content.replace(/школа\b/g, 'проєкт');
content = content.replace(/школою\b/g, 'проєктом');

content = content.replace(/schoolId/g, 'projectId');
content = content.replace(/VITE_SCHOOL_ID/g, 'VITE_PROJECT_ID');
content = content.replace(/schools/g, 'projects');
content = content.replace(/\bschool\b/g, 'project');

content = content.replace(/odesa_theater_project/g, 'teatralo4ka');
content = content.replace(/lviv_art_project/g, 'lviv_art');
content = content.replace(/kyiv_music_project/g, 'kyiv_music');

content = content.replace(/2026-04-05 v3/, '2026-04-06 v5 (Повна об\'єднана специфікація)');

// Оновлення секції 3.1
const section31Old = `### 3.1 Firestore: субколекції

Кожна проєкт ізольована в окремому документі колекції \`projects\`. Субколекція \`articles\` зберігає публікації проєкту.

\`\`\`
projects/                          ← колекція
  teatralo4ka/           ← документ проєкту
    name: "Одеська театральна проєкт"
    region: "Odesa"
    articles/                     ← субколекція публікацій
      {articleId}/
        ...поля документа
  lviv_art/
    articles/
      ...
\`\`\``;

const section31New = `### 3.1 Колекція \`users\` (Управління доступами)

Кожен користувач має єдиний профіль. Доступ до проєктів визначається словником \`projects\`.

\`\`\`json
// users/{uid}
{
  "email": "user@email.com",
  "isSuperAdmin": false,
  "projects": {
    "teatralo4ka": {
      "role": "admin",
      "permissions": { "canCreate": true, "canEdit": true, "canDelete": true }
    },
    "lviv_art": {
      "role": "moderator",
      "permissions": { "canCreate": true, "canEdit": false, "canDelete": false }
    }
  }
}
\`\`\`

### 3.1a Firestore: субколекції контенту

Кожен проєкт ізольований в окремому документі колекції \`projects\`. Субколекція \`articles\` зберігає публікації проєкту.

\`\`\`
projects/                         ← колекція
  teatralo4ka/                    ← документ проєкту
    articles/                     ← субколекція публікацій
      {articleId}/
        category: "news"
        title: "Заголовок"
        ...
  lviv_art/
    articles/
      ...
\`\`\``;

content = content.replace(section31Old, section31New);

// Оновлення секції 4.2 та 4.3 (колишня Custom Claims)
const section42Old = `### 4.2 Custom Claims

При створенні акаунту адміністратора через Firebase Admin SDK (виконується один раз, локально або через Cloud Function, **ніколи в браузері**) йому призначаються мітки в JWT-токені:

**Звичайний адмін проєкту:**

\`\`\`typescript
import admin from "firebase-admin";

await admin.auth().setCustomUserClaims(uid, {
  projectId: "teatralo4ka",
  role: "admin",
});
\`\`\`

**Супер-адмін (розробник):**

\`\`\`typescript
await admin.auth().setCustomUserClaims(uid, {
  role: "superadmin",
});
\`\`\`

Ці мітки автоматично включаються в кожен ID-токен і перевіряються Security Rules.`;

const section42New = `### 4.2 Процес реєстрації (Invite-only)

1. Нові користувачі не можуть просто зареєструватися і отримати профіль. 
2. Адміністратор додає емейл нового користувача в UI. Це створює "тимчасовий" документ в \`users\`, де ID = емейл (напр. \`users/test@test.com\`).
3. Користувач реєструється через Firebase Auth. При першому вході система бачить документ за його емейлом, мігрує його дані в документ за його новим UID і видаляє тимчасовий документ.
4. Правила Firestore дозволяють створити профіль за UID **тільки** якщо існує запрошення за email.

### 4.3 Custom Claims для Супер-адміна

При створенні акаунту супер-адміністратора через Firebase Admin SDK скрипт (\`make-superadmin.ts\`) йому призначаються мітки в JWT-токені:

\`\`\`typescript
import admin from "firebase-admin";

await admin.auth().setCustomUserClaims(uid, {
  role: "superadmin",
});
\`\`\`

Для звичайних користувачів ролі керуються виключно через документи \`users/{uid}\`, оскільки словник \`projects\` може перевищити обмеження розміру JWT токену (1000 байт), якщо користувач бере участь у десятках проєктів.`;

content = content.replace(section42Old, section42New);

// Оновлення Rules
const rulesOldRegex = /rules_version = '2';[\s\S]*?match \/projects\/{projectId} \{\n      allow read: if true;\n      allow write: if false;\n    \}\n  \}\n\}/;
const rulesNew = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isSuperAdmin() { return isSignedIn() && request.auth.token.role == "superadmin"; }

    function belongsToProject(projectId) {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             projectId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.projects;
    }

    function hasPerm(projectId, action) {
      return isSuperAdmin() || (
        belongsToProject(projectId) && (
          (action == 'create' && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.projects[projectId].permissions.canCreate == true) ||
          (action == 'edit' && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.projects[projectId].permissions.canEdit == true) ||
          (action == 'delete' && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.projects[projectId].permissions.canDelete == true)
        )
      );
    }

    match /projects/{projectId}/articles/{articleId} {
      allow read: if resource.data.isPublished == true || (isSignedIn() && (isSuperAdmin() || belongsToProject(projectId)));
      allow create: if hasPerm(projectId, 'create');
      allow update: if hasPerm(projectId, 'edit');
      allow delete: if hasPerm(projectId, 'delete');
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (
        request.auth.uid == userId || 
        request.auth.token.email.lower() == userId.lower() ||
        isSuperAdmin() || 
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
         get(/databases/$(database)/documents/users/$(userId)).data.keys().hasAny(get(/databases/$(database)/documents/users/$(request.auth.uid)).data.projects.keys()))
      );

      allow create: if isSuperAdmin() || (
        isSignedIn() && request.auth.uid == userId && 
        exists(/databases/$(database)/documents/users/$(request.auth.token.email.lower()))
      );
      allow update: if isSuperAdmin() || (
        isSignedIn() && request.resource.data.isSuperAdmin == false && request.resource.data.role != 'superadmin' &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid))
      );
      allow delete: if isSuperAdmin() || (
        isSignedIn() && request.auth.token.email.lower() == userId.lower()
      );
    }
  }
}`;

content = content.replace(rulesOldRegex, rulesNew);

// Оновлення заголовків для узгодження нумерації (було 4.3 -> 4.4)
content = content.replace('### 4.3 Firestore Security Rules', '### 4.4 Firestore Security Rules');
content = content.replace('### 4.4 Ізоляція адмін-панелей', '### 4.5 Ізоляція адмін-панелей');

fs.writeFileSync('.read_for_AI/2026-04-05-CLs5.md', content, 'utf8');
console.log('Done!');
