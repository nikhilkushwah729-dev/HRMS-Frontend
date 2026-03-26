const fs = require('fs');

function transformHtml(html) {
    return html
        // right side bg
        .replace(/bg-slate-50\b|bg-slate-50(?!\d)/g, 'bg-slate-900')
        // forms card bg
        .replace(/bg-white\/90 backdrop-blur-xl rounded-md lg:rounded-3xl shadow-xl shadow-slate-200\/50 border border-white(?!\/)/g, 'bg-slate-800/80 backdrop-blur-xl rounded-md lg:rounded-3xl shadow-2xl shadow-black/50 border border-slate-700')
        // texts
        .replace(/text-slate-900/g, 'text-white')
        .replace(/text-slate-700/g, 'text-slate-300')
        .replace(/text-slate-600/g, 'text-slate-400')
        .replace(/text-slate-500/g, 'text-slate-400')
        // alerts
        .replace(/bg-red-50 text-red-600 border border-red-100/g, 'bg-red-500/10 text-red-400 border border-red-500/20')
        .replace(/bg-indigo-50 text-indigo-700 border border-indigo-100/g, 'bg-primary-500/10 text-primary-400 border border-primary-500/20')
        .replace(/bg-green-50 text-green-700 border border-green-100/g, 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')
        // oauth buttons
        .replace(/bg-white border border-slate-200 rounded-md hover:bg-slate-50/g, 'bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700')
        // inputs
        .replace(/bg-white border border-slate-200/g, 'bg-slate-900/50 border border-slate-700 placeholder-slate-500')
        .replace(/bg-white text-xs/g, 'bg-slate-900/50 text-xs')
        // static gray boxes
        .replace(/bg-white border border-slate-200/g, 'bg-slate-800 border border-slate-700')
        // or divider
        .replace(/bg-white transform/g, 'bg-slate-800 transform')
        .replace(/border-b\b(?! border-)/g, 'border-b border-slate-700')
        // icons text color fix
        .replace(/stroke="#4f46e5"/g, 'stroke="#818cf8"')
        .replace(/text-primary-600/g, 'text-primary-400')
        // buttons
        .replace(/from-primary-600 to-primary-700/g, 'from-primary-500 to-primary-600')
        // borders
        .replace(/border-slate-100/g, 'border-slate-700')
        .replace(/border-slate-300/g, 'border-slate-600')
        // shadow
        .replace(/shadow-sm/g, 'shadow-md shadow-black/20')
        // remaining bgs
        .replace(/bg-white\b(?!\/)/g, 'bg-slate-800');
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
console.log('Done transforming auth views.');
