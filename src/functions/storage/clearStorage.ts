'use client';
import { syncLogger } from '@/debug/sync';
import { database } from '@/watermelondb';
// @ts-ignore
import { parse } from 'cookie';
/**
 * clearStorage 함수는 localStorage, cookie, WatermelonDB, 캐시 스토리지를 정리합니다.
 * @param {string | null} why - 정리 이유
 * @param {boolean} clearCache - 캐시 스토리지를 정리할지 여부
 * @param {boolean} clearServiceWorker - 레거시 서비스 워커를 정리할지 여부 (이전 PWA 사용자를 위해 유지)
 * @returns {Promise<boolean>} - 정리 성공 여부
 */
export async function clearStorage(
    why: string | null = null,
    clearCache: boolean = true,
    clearServiceWorker: boolean = true
): Promise<boolean> {
    syncLogger('Start cleanup process', why);
    // 직전 호출자 로깅
    const stack = new Error().stack;
    const caller = stack?.split('\n')[2]?.trim();
    syncLogger(`clearStorage 직전 호출자: ${caller}`);
    if (typeof window === 'undefined') return false;

    let success = true;

    try {
        syncLogger('Cleanup localStorage');
        // localStorage 정리
        const keys = Object.keys(localStorage);
        for (let key of keys) {
            if (key !== 'debug') {
                localStorage.removeItem(key);
            }
        }

        syncLogger('Cleanup cookie');
        // 쿠키 정리 - 개선된 방식
        const cookies = parse(document.cookie);
        for (const cookieName in cookies) {
            if (cookieName === 'OTU_LOCALE') continue;

            // 모든 가능한 경로와 도메인 조합으로 쿠키 삭제 시도
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;

            // 서브도메인을 포함한 도메인에서도 쿠키 삭제 시도
            const domainParts = window.location.hostname.split('.');
            if (domainParts.length > 2) {
                const rootDomain = domainParts.slice(domainParts.length - 2).join('.');
                document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${rootDomain}`;
            }
        }

        syncLogger('Cleanup WatermelonDB');
        try {
            await database.write(async () => {
                await database.unsafeResetDatabase();
            });
        } catch (error) {
            syncLogger(`Error cleaning up WatermelonDB: ${error}`);
            // 에러 로그
            success = false;
        }

        if (clearCache) {
            syncLogger('Cleanup Cache Storage');
            // 캐쉬 스토리지 정리
            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    for (const cacheName of cacheNames) {
                        await caches.delete(cacheName);
                    }
                    syncLogger('All caches cleared successfully');
                } catch (error) {
                    syncLogger(`Error clearing caches: ${error}`);
                    // 에러 로그
                    success = false;
                }
            }
        }

        if (clearServiceWorker) {
            syncLogger('Cleanup Service Workers');
            // 서비스 워커 제거
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                    syncLogger('All service workers unregistered successfully');
                } catch (error) {
                    syncLogger(`Error unregistering service workers: ${error}`);
                    // 에러 로그
                    success = false;
                }
            }
        }

        // 세션 스토리지도 정리
        try {
            syncLogger('Cleanup sessionStorage');
            sessionStorage.clear();
        } catch (error) {
            syncLogger(`Error clearing sessionStorage: ${error}`);
            // 에러는 이미 syncLogger로 로깅됨
            success = false;
        }

        syncLogger('End cleanup process');
        return success;
    } catch (error) {
        syncLogger(`Unexpected error in clearStorage: ${error}`);
        // 에러는 이미 syncLogger로 로깅됨
        return false;
    }
}

export async function clearOnlyWatermelonDB() {
    try {
        await database.write(async () => {
            await database.unsafeResetDatabase();
        });
        syncLogger('Watermelon DB cleared successfully');
        return true;
    } catch (error) {
        syncLogger(`Error clearing Watermelon DB: ${error}`);
        // 에러는 이미 syncLogger로 로깅됨
        return false;
    }
}
