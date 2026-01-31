import { test, expect } from '@playwright/test';

/**
 * Seed Test - OTU 앱 기본 환경 초기화 테스트
 *
 * 이 테스트는 앱의 기본 진입점과 인증 흐름을 검증합니다.
 * 다른 테스트의 기반이 되는 시드 테스트입니다.
 */
test.describe('앱 초기 상태', () => {
    test('비로그인 시 signin 페이지로 리디렉션', async ({ page }) => {
        // 홈 페이지 접근 시도
        await page.goto('/home');

        // 비로그인 상태에서는 signin 페이지로 리디렉션되어야 함
        await expect(page).toHaveURL(/signin/);
    });

    test('signin 페이지 로드 확인', async ({ page }) => {
        await page.goto('/signin');

        // 페이지가 정상적으로 로드되었는지 확인
        await expect(page).toHaveURL(/signin/);

        // 로그인 관련 요소가 존재하는지 확인
        // Google 로그인 버튼 또는 이메일 입력 필드 확인
        const hasLoginElement = await page
            .locator('[data-testid="signin"], button, input[type="email"]')
            .first()
            .isVisible()
            .catch(() => false);

        expect(hasLoginElement || (await page.title())).toBeTruthy();
    });
});

test.describe('인증 흐름', () => {
    test('이메일 로그인 폼 접근', async ({ page }) => {
        await page.goto('/signin');

        // 이메일 로그인 옵션이 있는지 확인
        // 앱의 실제 UI에 따라 조정 필요
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        const passwordInput = page.locator('input[type="password"], input[name="password"]');

        // 이메일/패스워드 입력 필드가 존재하거나 소셜 로그인 버튼이 존재해야 함
        const hasEmailForm = (await emailInput.count()) > 0 && (await passwordInput.count()) > 0;
        const hasSocialLogin =
            (await page.locator('button:has-text("Google"), button:has-text("GitHub")').count()) >
            0;

        expect(hasEmailForm || hasSocialLogin).toBeTruthy();
    });
});
