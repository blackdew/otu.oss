import { corsHeaders } from '../_shared/cors.ts';

/**
 * 서버 측 에러 응답을 생성합니다.
 *
 * @param {Object} params - 에러 응답에 대한 매개변수입니다.
 * @param {string} params.message - 표시될 에러 메시지입니다.
 * @param {Object} [params.meta={}] - 에러에 대한 추가 메타데이터입니다.
 * @param {string} [params.errorCode="SERVER_SIDE_ERROR"] - 에러 코드입니다.
 * @param {number} [params.status=500] - HTTP 상태 코드입니다.
 * @param {Object} [params.data={}] - 에러 응답에 보낼 추가 데이터입니다.
 * @param {Error} error - 기록될 에러 객체입니다.
 * @returns {NextResponse} - 에러 정보를 포함하는 Next.js 응답 객체입니다.
 */
function errorResponse(
    { message, meta = {}, errorCode = 'SERVER_SIDE_ERROR', status = 500, data = {} },
    error: any
) {
    // 응답 데이터 구성
    const responseData = {
        status: status,
        errorCode: errorCode,
        message: message,
        meta: meta,
    };

    const response = new Response(JSON.stringify(responseData), {
        status: status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    });
    return response;
}
/**
 * 성공 응답을 생성합니다.
 *
 * @param {Object} params - 성공 응답에 대한 매개변수입니다.
 * @param {string} params.message - 표시될 성공 메시지입니다.
 * @param {Object} [params.meta={}] - 응답에 대한 추가 메타데이터입니다.
 * @param {number} [params.status=200] - HTTP 상태 코드입니다.
 * @param {Object} params.data - 응답에 보낼 데이터입니다.
 * @returns {NextResponse} - 성공 정보를 포함하는 Next.js 응답 객체입니다.
 */
export function successResponse({ message, meta = {}, status = 200, data }) {
    // 응답 데이터 구성
    const responseData = {
        status: status,
        message: message,
        meta: meta,
        data: data,
    };

    const response = new Response(JSON.stringify(responseData), {
        status: status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    });
    return response;
}

export default errorResponse;
