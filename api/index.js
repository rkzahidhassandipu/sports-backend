// api/index.js

// আপনার বিল্ড করা মূল এক্সপ্রেস অ্যাপটি ইম্পোর্ট করা হচ্ছে
// 'dist/app' হচ্ছে সেই ফাইল যেখানে আপনি 'export default app' করেছেন
const app = require('../dist/app').default;

// Vercel-এর জন্য অ্যাপটি এক্সপোর্ট করা হচ্ছে
module.exports = app;