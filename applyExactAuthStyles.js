import fs from 'fs';
import path from 'path';

const files = [
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/auth/LoginPage.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/auth/RegisterPage.jsx',
];

const replacements = [
    // Container card
    {
        regex: /bg-\[\#0B0B0B\]\/75 backdrop-blur-\[12px\] border border-white\/5 rounded-2xl p-8 sm:p-10 shadow-2xl relative/g,
        to: "w-full max-w-[420px] bg-[rgba(11,11,11,0.85)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.05)] rounded-[16px] p-[40px] shadow-2xl relative mx-auto"
    },
    // Inputs
    { regex: /rounded-xl pl-12/g, to: "rounded-[10px] pl-12" },
    { regex: /py-3\.5 text-\[\#F5F5F5\]/g, to: "py-[14px] text-white" },
    { regex: /focus:shadow-\[0_0_15px_rgba\(245,185,66,0\.15\)\]/g, to: "focus:shadow-[0_0_8px_rgba(245,185,66,0.4)]" },
    { regex: /text-\[\#F5F5F5\] outline-none/g, to: "text-white outline-none" },
    { regex: /rounded-2xl px-5 py-4 text-\[\#F5F5F5\] focus:outline-none/g, to: "rounded-[10px] px-5 py-[14px] text-white focus:outline-none" }, // some from register page
    // Buttons
    {
        regex: /bg-gradient-to-br from-\[\#F5B942\] to-\[\#D4A017\] text-\[\#050505\] font-extrabold py-4 rounded-xl transition-all shadow-\[0_5px_15px_rgba\(245,185,66,0\.2\)\] hover:shadow-\[0_5px_25px_rgba\(245,185,66,0\.4\)\]/g,
        to: "bg-[linear-gradient(135deg,#F5B942,#D4A017)] text-[#050505] font-semibold py-[14px] rounded-[10px] transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(245,185,66,0.6)]"
    }
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
