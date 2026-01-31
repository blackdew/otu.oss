import { test as setup, expect } from '@playwright/test';

/**
 * Auth Setup - 인증 상태 초기화
 *
 * 테스트 실행 전 인증 상태를 설정합니다.
 * 현재는 비로그인 상태로 테스트를 진행하므로 빈 설정입니다.
 *
 * TODO: 로그인이 필요한 테스트를 위해 인증 상태 저장 로직 추가
 * 참고: https://playwright.dev/docs/auth
 */

const authFile = 'playwright/.auth/user.json';

setup('앱 접근 가능 확인', async ({ page }) => {
    // 앱이 정상적으로 접근 가능한지 확인
    await page.goto('/signin');

    // 페이지가 로드되는지 확인
    await expect(page).toHaveURL(/signin/);
});

// 로그인 테스트를 위한 설정 (향후 활성화)
// setup('authenticate', async ({ page }) => {
//     // 로그인 수행
//     await page.goto('/signin');
//     await page.getByPlaceholder('email').fill('test@example.com');
//     await page.getByPlaceholder('password').fill('password');
//     await page.getByRole('button', { name: /로그인/ }).click();
//
//     // 로그인 상태 저장
//     await page.context().storageState({ path: authFile });
// });
