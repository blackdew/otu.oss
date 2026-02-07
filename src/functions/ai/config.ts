/**
 * AI 기능 설정 유틸리티
 *
 * AI 관련 환경변수(API 키 또는 Gateway)가 설정되어 있으면 자동으로 활성화됩니다.
 * API 키가 없는 환경에서도 앱이 정상 동작하도록 graceful fallback을 제공합니다.
 */

/**
 * OpenAI API 키가 설정되어 있는지 확인
 */
export function isOpenAIConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
}

/**
 * AI 기능이 활성화되어 있는지 확인
 * 개발 환경에서는 OPENAI_API_KEY가 설정되어 있으면 활성화
 * 프로덕션에서는 Vercel AI Gateway를 사용하므로 항상 활성화
 */
export function isAIEnabled(): boolean {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
        return isOpenAIConfigured();
    }
    // 프로덕션에서는 Gateway를 사용하므로 항상 활성화
    return true;
}

/**
 * 임베딩 API가 설정되어 있는지 확인
 * 개발 환경에서는 OpenAI API 키, 프로덕션에서는 Vercel AI Gateway 사용
 */
export function isEmbeddingConfigured(): boolean {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
        return isOpenAIConfigured();
    }
    // 프로덕션에서는 Gateway를 사용하므로 항상 true
    return true;
}

/**
 * AI 기능을 사용할 수 있는지 확인
 * 개발 환경에서는 OPENAI_API_KEY 필요, 프로덕션에서는 Gateway 사용으로 항상 가능
 */
export function canUseAI(): boolean {
    return isAIEnabled();
}

/**
 * RAG/임베딩 기능을 사용할 수 있는지 확인
 */
export function canUseEmbeddings(): boolean {
    return isAIEnabled() && isEmbeddingConfigured();
}

/**
 * AI 비활성화 이유를 반환
 */
export function getAIDisabledReason(): string {
    if (isAIEnabled()) {
        return 'UNKNOWN';
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && !isOpenAIConfigured()) {
        return 'OPENAI_API_KEY_NOT_SET';
    }

    return 'UNKNOWN';
}

/**
 * 임베딩 비활성화 이유를 반환
 */
export function getEmbeddingsDisabledReason(): string {
    if (isAIEnabled()) {
        return 'UNKNOWN';
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && !isOpenAIConfigured()) {
        return 'OPENAI_API_KEY_NOT_SET';
    }

    return 'UNKNOWN';
}
