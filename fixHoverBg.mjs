import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'fs';

// Find all JSX files under src/
const files = [
    // Pages
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/public/FAQPage.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/public/DetailsPage.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/dashboard/user/UserReviewsPage.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/dashboard/user/NotificationsPage.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/dashboard/admin/AdminDashboard.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/pages/booking/CheckoutPage.jsx',
    // Components
    'd:/GUVI TASK/CAPSTONE/frontend/src/components/common/SiteAlertModal.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/components/common/ReservationCancelModal.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/components/common/ReservationRescheduleModal.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/components/common/NotificationBell.jsx',
    'd:/GUVI TASK/CAPSTONE/frontend/src/components/AI/AIChatAssistant.jsx',
];

const replacements = [
    // Main sidebar nav pattern: remove hover:bg-white/5 from inactive nav items
    [/\shover:bg-white\/5\s+hover:text-\[#F5F5F5\]/g, ' hover:text-[#F5B942]'],
    [/\shover:bg-white\/5\s+hover:text-white/g, ' hover:text-[#F5B942]'],
    [/\shover:bg-white\/\[0\.02\]\s+transition/g, ' transition'],
    [/\shover:bg-white\/\[0\.03\]\s+transition/g, ' transition'],
    [/\shover:bg-white\/\[0\.04\]/g, ''],
    // Remove hover:bg-white/5 standalone
    [/\shover:bg-white\/5\b/g, ''],
    // Remove hover:bg-white/10
    [/\shover:bg-white\/10\b/g, ''],
    // Remove hover:bg-white/20
    [/\shover:bg-white\/20\b/g, ''],
    // Remove hover:bg-amber-500/10
    [/\shover:bg-amber-500\/10\b/g, ''],
    // Notification unread hover
    [/hover:bg-amber-500\/10/g, ''],
    // Remove hover:bg-red-500/5
    [/\shover:bg-red-500\/5\b/g, ''],
    // Remove hover:bg-blue-500/20
    [/\shover:bg-blue-500\/20\b/g, ''],
];

let totalChanged = 0;
for (const file of files) {
    try {
        let content = readFileSync(file, 'utf8');
        const original = content;
        for (const [pattern, replacement] of replacements) {
            content = content.replace(pattern, replacement);
        }
        if (content !== original) {
            writeFileSync(file, content, 'utf8');
            console.log('✓ Updated: ' + file.split('/').pop());
            totalChanged++;
        } else {
            console.log('- No changes: ' + file.split('/').pop());
        }
    } catch (e) {
        console.error('✗ Error on ' + file + ': ' + e.message);
    }
}
console.log('\nDone. ' + totalChanged + ' file(s) updated.');
