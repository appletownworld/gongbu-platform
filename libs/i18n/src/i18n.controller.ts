import { Controller, Get, Query } from '@nestjs/common';
import { I18nService, SupportedLanguage } from './i18n.service';

@Controller('i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('translate')
  translate(
    @Query('key') key: string,
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('params') params?: string
  ) {
    const parsedParams = params ? JSON.parse(params) : undefined;
    return {
      key,
      language,
      translation: this.i18nService.translate(key, language, parsedParams)
    };
  }

  @Get('languages')
  getSupportedLanguages() {
    return {
      languages: this.i18nService.getSupportedLanguages(),
      default: this.i18nService.getDefaultLanguage()
    };
  }
}
