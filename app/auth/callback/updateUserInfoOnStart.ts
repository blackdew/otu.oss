import { authLogger } from '@/debug/auth';
import { FREE_PLAN_USAGE_LIMIT, SESSION_USER_ID_FOR_CHECK_SYNC } from '@/functions/constants';
import { getCookie, setCookie } from '@/functions/utils/cookie';
import { getFirstDayOfMonth } from '@/functions/utils/getFirstDayOfMonth';
import { createClient } from '@/supabase/utils/client';

const AGREEMENTS_COOKIE_NAME = 'agreements';

async function updateOrInsertUserInfo(supabase: any, user_info: any) {
    const { count, error: countError } = await supabase
        .from('user_info')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_info.user_id);

    if (count === null || countError) {
        authLogger('user_info 조회 실패', countError);
        throw new Error('Failed to check user_info');
    }

    authLogger('user_info 행 갯수', count);

    if (count > 0) {
        const { data: updatedUserInfo, error: updateError } = await supabase
            .from('user_info')
            .update(user_info)
            .eq('user_id', user_info.user_id);

        if (updateError) {
            authLogger('업데이트 실패', updateError);
        } else {
            authLogger('업데이트 완료', updatedUserInfo);
        }
    } else {
        const { data: insertedUserInfo, error: insertError } = await supabase
            .from('user_info')
            .insert(user_info);

        if (insertError) {
            authLogger('삽입 실패', insertError);
        } else {
            authLogger('삽입 완료', insertedUserInfo);
        }
    }
}

function parseAgreementsCookie() {
    const agreements = getCookie(AGREEMENTS_COOKIE_NAME);
    authLogger('agreements cookie', agreements);
    if (agreements) {
        const parsedAgreements = JSON.parse(agreements);
        setCookie(AGREEMENTS_COOKIE_NAME, '', -1); // 쿠키 삭제
        return parsedAgreements;
    }
    return null;
}

function updateUserInfoWithAgreements(user_info: any, parsedAgreements: any) {
    if (parsedAgreements.termsOfService) {
        user_info.terms_of_service_consent_version = parsedAgreements.termsOfService.version;
    }
    if (parsedAgreements.privacyPolicy) {
        user_info.privacy_policy_consent_version = parsedAgreements.privacyPolicy.version;
    }
    if (parsedAgreements.marketing) {
        user_info.marketing_consent_version = parsedAgreements.marketing.version;
    }
}

export async function updateUserInfoOnStart(user_id: string) {
    authLogger('updateUserInfoStartDate 시작', user_id);
    const supabase = createClient();

    let user_info: {
        user_id: string;
        marketing_consent_version?: string;
        marketing_consent_updated_at?: string;
        privacy_policy_consent_version?: string;
        privacy_policy_consent_updated_at?: string;
        terms_of_service_consent_version?: string;
        terms_of_service_consent_updated_at?: string;
    } = { user_id };

    authLogger('사용자 초기 정보', 'user_info:', user_info);

    const parsedAgreements = parseAgreementsCookie();
    if (parsedAgreements) {
        updateUserInfoWithAgreements(user_info, parsedAgreements);
    }

    await updateOrInsertUserInfo(supabase, user_info);

    setCookie(SESSION_USER_ID_FOR_CHECK_SYNC, user_id, 365 * 100); // 100년 동안 유효한 쿠키 설정
}
