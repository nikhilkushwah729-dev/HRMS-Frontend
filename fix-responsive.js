const fs = require('fs');

function transformHtml(html) {
    return html
        // Main wrapper: allow strict height on desktop to prevent document body scroll
        .replace(/<div class="flex min-h-\[100dvh\] w-full overflow-x-hidden/g, '<div class="flex flex-col lg:flex-row min-h-[100dvh] lg:h-[100dvh] w-full overflow-hidden')

        // Right panel flex configuration
        .replace(/<div class="flex-1 bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto">/g, '<div class="flex-1 bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto w-full h-full lg:h-auto">')

        // Remove vertical margin from card wrapper that causes overflow
        .replace(/<div class="w-full max-w-\[420px\] relative z-10 my-4/g, '<div class="w-full max-w-[420px] relative z-10 my-auto py-4')
        .replace(/<div class="w-full max-w-\[400px\] relative z-10 my-4/g, '<div class="w-full max-w-[400px] relative z-10 my-auto py-4')
        .replace(/<div class="w-full max-w-\[460px\] relative z-10 my-4/g, '<div class="w-full max-w-[460px] relative z-10 my-auto py-4')

        // Reduce min-heights of the card to let flex handle it naturally
        .replace(/min-h-\[520px\] sm:min-h-\[540px\] lg:min-h-\[560px\]/g, '')

        // Make padding inside the card adaptive
        .replace(/padding: 2rem;/g, 'padding: 1.5rem;')
        .replace(/p-6 lg:p-8/g, 'p-5 sm:p-6 lg:p-8')

        // Hide mobile logo wrapper margin bottom to save space
        .replace(/<div class="lg:hidden flex items-center justify-center gap-2 mb-6/g, '<div class="lg:hidden flex items-center justify-center gap-2 mb-4')

        // Reduce input padding slightly on mobile to prevent excessive height
        .replace(/py-2\.5 lg:py-3/g, 'py-2 sm:py-2.5 lg:py-3')

        // Ensure the overall wrapper doesn't have an unnecessary auto height if we want 100dvh
        .replace(/min-h-[100dvh]/g, 'min-h-[100dvh]');
}

const files = [
    'd:/HRMS_FRONTEND/src/app/features/auth/login/login.component.html',
    'd:/HRMS_FRONTEND/src/app/features/auth/signup/signup.component.ts',
    'd:/HRMS_FRONTEND/src/app/features/auth/forgot-password.component.ts',
    'd:/HRMS_FRONTEND/src/app/features/auth/reset-password.component.ts'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    content = transformHtml(content);
    fs.writeFileSync(file, content, 'utf8');
}
console.log('Done fixing layout issues.');
