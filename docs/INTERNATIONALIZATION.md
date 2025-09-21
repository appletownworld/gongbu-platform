# Internationalization (i18n) Guide

## Overview

Gongbu Platform поддерживает многоязычность для глобального охвата аудитории. Платформа изначально разработана с поддержкой трех основных языков: английского, корейского и русского.

## Supported Languages

### 🇺🇸 English (Английский)
- **Code**: `en`
- **Locale**: `en-US`
- **Target Audience**: International users
- **Features**:
  - Full interface localization
  - Complete documentation
  - SEO optimization for English-speaking users
  - Support for English language courses

### 🇰🇷 한국어 (Корейский)
- **Code**: `ko`
- **Locale**: `ko-KR`
- **Target Audience**: Korean users
- **Features**:
  - Full Hangul and Hanja support
  - Korean language courses
  - Integration with Korean payment systems
  - Cultural adaptation for Korean users

### 🇷🇺 Русский
- **Code**: `ru`
- **Locale**: `ru-RU`
- **Target Audience**: Russian-speaking users
- **Features**:
  - Full Cyrillic support
  - Russian language courses
  - Integration with Russian payment systems
  - Cultural adaptation for Russian users

## Technical Implementation

### Frontend (React/Next.js)

```typescript
// i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // English translations
    }
  },
  ko: {
    translation: {
      // Korean translations
    }
  },
  ru: {
    translation: {
      // Russian translations
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });
```

### Backend (NestJS)

```typescript
// Language detection middleware
@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const acceptLanguage = req.headers['accept-language'];
    const language = this.detectLanguage(acceptLanguage);
    req['language'] = language;
    next();
  }

  private detectLanguage(acceptLanguage: string): string {
    // Language detection logic
    if (acceptLanguage?.includes('ko')) return 'ko';
    if (acceptLanguage?.includes('ru')) return 'ru';
    return 'en'; // default
  }
}
```

### Database Schema

```sql
-- Multilingual content support
CREATE TABLE course_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  language_code VARCHAR(5) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, language_code)
);

-- User language preferences
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'en';
ALTER TABLE users ADD COLUMN interface_language VARCHAR(5) DEFAULT 'en';
```

## Content Management

### Course Content

```typescript
interface CourseContent {
  id: string;
  translations: {
    [language: string]: {
      title: string;
      description: string;
      content: LessonContent[];
    };
  };
  defaultLanguage: string;
  availableLanguages: string[];
}
```

### Dynamic Content Loading

```typescript
// Content loading based on user language
async function getCourseContent(courseId: string, language: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      translations: {
        where: { languageCode: language }
      }
    }
  });

  return course?.translations[0] || course?.translations.find(t => t.languageCode === 'en');
}
```

## Localization Features

### Currency Support

```typescript
const currencies = {
  en: { code: 'USD', symbol: '$', locale: 'en-US' },
  ko: { code: 'KRW', symbol: '₩', locale: 'ko-KR' },
  ru: { code: 'RUB', symbol: '₽', locale: 'ru-RU' }
};
```

### Date and Time Formatting

```typescript
const dateFormats = {
  en: 'MM/DD/YYYY',
  ko: 'YYYY.MM.DD',
  ru: 'DD.MM.YYYY'
};

const timeFormats = {
  en: '12h',
  ko: '24h',
  ru: '24h'
};
```

### Number Formatting

```typescript
const numberFormats = {
  en: { decimal: '.', thousands: ',' },
  ko: { decimal: '.', thousands: ',' },
  ru: { decimal: ',', thousands: ' ' }
};
```

## SEO and Marketing

### URL Structure

```
https://gongbu-platform.com/en/courses/korean-basics
https://gongbu-platform.com/ko/courses/korean-basics
https://gongbu-platform.com/ru/courses/korean-basics
```

### Meta Tags

```html
<!-- English -->
<meta property="og:locale" content="en_US">
<meta name="description" content="Learn Korean with interactive courses">

<!-- Korean -->
<meta property="og:locale" content="ko_KR">
<meta name="description" content="인터랙티브 코스로 한국어를 배우세요">

<!-- Russian -->
<meta property="og:locale" content="ru_RU">
<meta name="description" content="Изучайте корейский язык с интерактивными курсами">
```

## Payment Integration

### Multi-Currency Support

```typescript
const paymentMethods = {
  en: {
    stripe: { currency: 'USD' },
    paypal: { currency: 'USD' }
  },
  ko: {
    stripe: { currency: 'KRW' },
    toss: { currency: 'KRW' },
    kakao: { currency: 'KRW' }
  },
  ru: {
    stripe: { currency: 'RUB' },
    yookassa: { currency: 'RUB' },
    sberbank: { currency: 'RUB' }
  }
};
```

## Testing

### Language Testing

```typescript
describe('Internationalization', () => {
  test('should display English content', async () => {
    const response = await request(app)
      .get('/api/courses')
      .set('Accept-Language', 'en');
    
    expect(response.body.title).toBe('Korean Language Course');
  });

  test('should display Korean content', async () => {
    const response = await request(app)
      .get('/api/courses')
      .set('Accept-Language', 'ko');
    
    expect(response.body.title).toBe('한국어 코스');
  });

  test('should display Russian content', async () => {
    const response = await request(app)
      .get('/api/courses')
      .set('Accept-Language', 'ru');
    
    expect(response.body.title).toBe('Курс корейского языка');
  });
});
```

## Deployment

### Environment Variables

```bash
# Default language
DEFAULT_LANGUAGE=en

# Supported languages
SUPPORTED_LANGUAGES=en,ko,ru

# Language-specific configurations
EN_CURRENCY=USD
KO_CURRENCY=KRW
RU_CURRENCY=RUB
```

### CDN Configuration

```json
{
  "cache_rules": [
    {
      "path": "/en/*",
      "cache_control": "public, max-age=3600"
    },
    {
      "path": "/ko/*",
      "cache_control": "public, max-age=3600"
    },
    {
      "path": "/ru/*",
      "cache_control": "public, max-age=3600"
    }
  ]
}
```

## Best Practices

### Content Creation

1. **Native Speakers**: Use native speakers for translation
2. **Cultural Context**: Adapt content for cultural differences
3. **Consistency**: Maintain consistent terminology across languages
4. **Testing**: Test all languages thoroughly

### Performance

1. **Lazy Loading**: Load translations on demand
2. **Caching**: Cache translated content
3. **CDN**: Use CDN for static language assets
4. **Compression**: Compress translation files

### User Experience

1. **Language Detection**: Auto-detect user language
2. **Easy Switching**: Allow easy language switching
3. **Fallback**: Always provide English fallback
4. **RTL Support**: Support right-to-left languages if needed

## Future Expansion

### Additional Languages

The platform is designed to easily support additional languages:

- 🇯🇵 Japanese (日本語)
- 🇨🇳 Chinese (中文)
- 🇩🇪 German (Deutsch)
- 🇫🇷 French (Français)
- 🇪🇸 Spanish (Español)

### Implementation Steps

1. Add language code to supported languages
2. Create translation files
3. Update database schema if needed
4. Configure payment methods
5. Test thoroughly
6. Deploy and monitor

## Monitoring

### Analytics

```typescript
// Track language usage
analytics.track('language_selected', {
  language: userLanguage,
  user_id: userId,
  timestamp: new Date()
});
```

### Error Monitoring

```typescript
// Monitor translation errors
if (!translation) {
  logger.error('Missing translation', {
    key: translationKey,
    language: requestedLanguage,
    fallback: 'en'
  });
}
```

This internationalization guide ensures that Gongbu Platform can effectively serve users across different languages and cultures while maintaining high quality and performance.
