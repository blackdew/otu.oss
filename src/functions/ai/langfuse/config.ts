/**
 * Langfuse 설정 및 초기화
 *
 * LLM/RAG 시스템의 품질 모니터링을 위한 Langfuse 통합입니다.
 * 환경 변수가 설정되지 않으면 graceful하게 비활성화됩니다.
 *
 * @see https://langfuse.com/docs
 */

import { Langfuse } from 'langfuse';

/**
 * Langfuse 설정 인터페이스
 */
export interface LangfuseConfig {
    /** Langfuse 활성화 여부 */
    enabled: boolean;
    /** Public Key */
    publicKey?: string;
    /** Secret Key */
    secretKey?: string;
    /** Langfuse 서버 URL (Self-hosted인 경우) */
    baseUrl?: string;
    /** 디버그 모드 */
    debug?: boolean;
}

/**
 * 환경 변수에서 Langfuse 설정을 로드합니다.
 */
export function loadLangfuseConfig(): LangfuseConfig {
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const baseUrl = process.env.LANGFUSE_HOST;

    // 환경 변수가 없으면 비활성화
    const enabled =
        process.env.LANGFUSE_ENABLED !== 'false' && Boolean(publicKey) && Boolean(secretKey);

    return {
        enabled,
        publicKey,
        secretKey,
        baseUrl,
        debug: process.env.NODE_ENV === 'development',
    };
}

// 싱글톤 Langfuse 인스턴스
let langfuseInstance: Langfuse | null = null;
let langfuseConfig: LangfuseConfig | null = null;

/**
 * Langfuse 인스턴스를 가져옵니다.
 * 설정이 없으면 null을 반환합니다.
 */
export function getLangfuse(): Langfuse | null {
    if (langfuseConfig === null) {
        langfuseConfig = loadLangfuseConfig();
    }

    if (!langfuseConfig.enabled) {
        return null;
    }

    if (langfuseInstance === null) {
        langfuseInstance = new Langfuse({
            publicKey: langfuseConfig.publicKey!,
            secretKey: langfuseConfig.secretKey!,
            baseUrl: langfuseConfig.baseUrl,
        });
    }

    return langfuseInstance;
}

/**
 * Langfuse 활성화 여부를 확인합니다.
 */
export function isLangfuseEnabled(): boolean {
    if (langfuseConfig === null) {
        langfuseConfig = loadLangfuseConfig();
    }
    return langfuseConfig.enabled;
}

/**
 * Langfuse 비활성화 이유를 반환합니다.
 */
export function getLangfuseDisabledReason(): string | null {
    if (langfuseConfig === null) {
        langfuseConfig = loadLangfuseConfig();
    }

    if (langfuseConfig.enabled) {
        return null;
    }

    if (process.env.LANGFUSE_ENABLED === 'false') {
        return 'LANGFUSE_ENABLED is set to false';
    }

    if (!langfuseConfig.publicKey) {
        return 'LANGFUSE_PUBLIC_KEY is not set';
    }

    if (!langfuseConfig.secretKey) {
        return 'LANGFUSE_SECRET_KEY is not set';
    }

    return 'Unknown reason';
}

/**
 * Langfuse 인스턴스를 종료합니다.
 * 서버 종료 시 호출해야 합니다.
 */
export async function shutdownLangfuse(): Promise<void> {
    if (langfuseInstance) {
        await langfuseInstance.shutdownAsync();
        langfuseInstance = null;
    }
}
