import fs from 'fs';
import path from 'path';

const files = [
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/auth/LoginPage.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/auth/RegisterPage.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/auth/ForgotPasswordPage.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/auth/ResetPasswordPage.jsx'
];

const replacements = [
    { regex: /bg-zinc-950/g, to: "bg-[#050505]" },
    { regex: /bg-zinc-900/g, to: "bg-[#0B0B0B]" },
    { regex: /bg-zinc-800/g, to: "bg-[#121212]" },
    { regex: /text-amber-500/g, to: "text-[#F5B942]" },
    { regex: /text-amber-400/g, to: "text-[#F5B942]" },
    { regex: /text-white/g, to: "text-[#F5F5F5]" },
    { regex: /border-white\/5/g, to: "border-[#1F1F1F]" },
    { regex: /border-white\/10/g, to: "border-[#1F1F1F]" },
    { regex: /text-zinc-500/g, to: "text-[#A1A1A1]" },
    { regex: /text-zinc-400/g, to: "text-[#A1A1A1]" },
    { regex: /text-zinc-600/g, to: "text-[#3a3a3a]" },
    { regex: /bg-amber-500/g, to: "bg-[#F5B942]" },
    { regex: /border-amber-500/g, to: "border-[#F5B942]" },
    { regex: /fill-amber-500/g, to: "fill-[#F5B942]" },
    { regex: /text-amber-500\/20/g, to: "text-[#F5B942]/20" },
    { regex: /bg-amber-500\/10/g, to: "bg-[#F5B942]/10" },
    { regex: /bg-amber-500\/5/g, to: "bg-[#F5B942]/5" },
    { regex: /border-amber-500\/20/g, to: "border-[#F5B942]/20" },
    { regex: /border-amber-500\/30/g, to: "border-[#F5B942]/30" },
    { regex: /shadow-amber-500\/10/g, to: "shadow-[#F5B942]/10" },
    { regex: /shadow-amber-500\/20/g, to: "shadow-[#F5B942]/20" },
    { regex: /shadow-\[0_0_20px_rgba\(212,175,55,0\.2\)\]/g, to: "shadow-[0_0_20px_rgba(245,185,66,0.2)]" },
    { regex: /shadow-\[0_10px_20px_rgba\(212,175,55,0\.2\)\]/g, to: "shadow-[0_10px_20px_rgba(245,185,66,0.2)]" },
    { regex: /shadow-\[0_0_30px_rgba\(212,175,55,0\.2\)\]/g, to: "shadow-[0_0_30px_rgba(245,185,66,0.2)]" },
    { regex: /shadow-\[0_0_10px_rgba\(212,175,55,0\.3\)\]/g, to: "shadow-[0_0_10px_rgba(245,185,66,0.3)]" },
    { regex: /shadow-\[0_0_15px_rgba\(212,175,55,0\.1\)\]/g, to: "shadow-[0_0_15px_rgba(245,185,66,0.1)]" },
    { regex: /shadow-amber-500\/30/g, to: "shadow-[#F5B942]/30" },
    { regex: /from-amber-700/g, to: "from-[#D4A017]" },
    { regex: /to-amber-500/g, to: "to-[#F5B942]" },
    { regex: /bg-zinc-700/g, to: "bg-[#1F1F1F]" },
    { regex: /text-zinc-700/g, to: "text-[#1F1F1F]" },
    { regex: /text-zinc-300/g, to: "text-[#F5F5F5]" },
    { regex: /bg-black\/40/g, to: "bg-[#050505]" }
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        replacements.forEach(r => {
            content = content.replace(r.regex, r.to);
        });
        fs.writeFileSync(file, content);
        console.log(`Updated ${path.basename(file)}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
