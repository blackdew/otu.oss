import { headers } from 'next/headers';

/**
 * 서버 사이드에서 앱의 URL을 동적으로 가져옵니다.
 * headers()를 사용하므로 동적 렌더링이 됩니다.
 */
export async function getAppUrl(): Promise<string> {
    const host = (await headers()).get('host');
    if (!host) return 'https://otu.ai';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
}
