import { clearStorage } from '@/functions/storage/clearStorage';
import { createClient } from '@/supabase/utils/client';

export async function ifLogoutClearAndRedirect() {
    console.log('ifLogoutClearAndRedirect 함수가 실행되었고 로그인 상태를 확인합니다.');
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            console.log('로그인 상태이므로 종료합니다');
            return true;
        } else {
            console.log('로그아웃 상태이므로 모든 데이터를 삭제하고 welcome 페이지로 이동합니다.');

            // 스토리지 정리 시도
            const clearSuccess = await clearStorage(
                'ifLogoutClearAndRedirect 호출, 사용자 정보를 찾을 수 없어서 clearStorage 호출'
            );

            if (clearSuccess) {
                console.log('ifLogoutClearAndRedirect: 스토리지 정리 성공');
            } else {
                // 스토리지 정리 실패 시 다시 시도
                console.warn('ifLogoutClearAndRedirect: 스토리지 정리 실패, 다시 시도');

                // 두 번째 시도
                const secondAttempt = await clearStorage('ifLogoutClearAndRedirect 두 번째 시도');

                if (secondAttempt) {
                    console.log('ifLogoutClearAndRedirect: 두 번째 시도 성공');
                } else {
                    console.error('ifLogoutClearAndRedirect: 두 번째 시도도 실패');
                }
            }

            // 스토리지 정리 완료 후 즉시 리다이렉트
            // Client Component에서는 window.location.href 사용
            if (typeof window !== 'undefined') {
                window.location.href = '/welcome';
            }
            return false;
        }
    } catch (error) {
        // 에러 처리 로직
        console.error('ifLogoutClearAndRedirect error:', error);
        throw error;
    }
}
