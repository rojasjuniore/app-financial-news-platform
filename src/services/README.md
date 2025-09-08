# Services Directory Structure

## 📁 Organization

Services are organized by domain/functionality:

```
services/
├── auth/               # Authentication services
│   ├── authService.ts  # Firebase auth implementation
│   └── index.ts        # Auth exports
│
├── chat/               # Chat & AI services
│   ├── chatService.ts  # Chat API implementation
│   └── index.ts        # Chat exports
│
├── news/               # News & feed services
│   ├── api.ts          # API client for news endpoints
│   ├── feedService.ts  # User feed & personalization
│   └── index.ts        # News exports
│
├── firebase/           # Firebase configuration
│   ├── firebase.ts     # Firebase initialization
│   └── index.ts        # Firebase exports
│
└── panel/              # Panel discussion services
    ├── panelDiscussionService.ts  # AI panel discussions
    └── index.ts        # Panel exports
```

## 🔧 Usage

Import services from their domain folders:

```typescript
// Authentication
import { authService } from '@/services/auth';

// Chat
import { chatService } from '@/services/chat';

// News & Feed
import { feedService } from '@/services/news/feedService';
import apiClient from '@/services/news/api';

// Firebase
import { auth, db } from '@/services/firebase';

// Panel Discussion
import { panelDiscussionService } from '@/services/panel';
```

## 📝 Service Descriptions

### Auth Service
- User authentication (login, register, logout)
- Google OAuth integration
- Session management
- User profile management

### Chat Service
- AI chat interactions
- Message history
- Context management
- Response streaming

### News Services
- **api.ts**: REST API client for backend endpoints
- **feedService.ts**: User feed personalization, saved articles, interests management

### Firebase Service
- Firebase app initialization
- Firestore database connection
- Authentication provider setup

### Panel Service
- Multi-LLM panel discussions
- Opinion generation
- Article analysis with different AI perspectives