# 🔒 سياسة الأمان

## 📋 الإبلاغ عن الثغرات الأمنية

نحن نأخذ أمان **Crypto Arbitrage Pro** على محمل الجد.

### ⚠️ إذا اكتشفت ثغرة أمنية

**الرجاء عدم فتح Issue عام!**

بدلاً من ذلك:

1. **أرسل إيميلاً إلى:** security@cryptoarbpro.com
2. **أو استخدم GitHub Security Advisories:**
   - اذهب إلى: Security → Advisories → New advisory
   - املأ التفاصيل

### 📝 ما يجب تضمينه

- وصف مفصل للثغرة
- خطوات إعادة الإنتاج
- التأثير المحتمل
- اقتراح للإصلاح (إذا كان لديك)

### ⏱️ ماذا تتوقع

- **تأكيد الاستلام:** خلال 24 ساعة
- **تقييم أولي:** خلال 72 ساعة
- **تحديثات منتظمة:** كل أسبوع
- **الإصلاح:** حسب شدة الثغرة

---

## 🛡️ الممارسات الأمنية

### للمساهمين

1. **لا ترفع أسرار إلى GitHub**
   - ❌ لا ترفع `.env`
   - ❌ لا ترفع مفاتيح خاصة
   - ✅ استخدم `.env.example`

2. **راجع الكود قبل الـ commit**
   - تحقق من عدم وجود أسرار
   - استخدم `git-secrets` أو `trufflehog`

3. **استخدم Dependencies آمنة**
   - حدّث الاعتماديات بانتظام
   - راقب التنبيهات الأمنية
   - استخدم `npm audit`

### للمستخدمين

1. **حماية المحفظة**
   - استخدم محفظة مخصصة للتطوير
   - لا تشارك المفتاح الخاص
   - فعّل 2FA

2. **المتغيرات البيئية**
   - لا تشارك `.env`
   - استخدم مفاتيح مختلفة للإنتاج والتطوير
   - دوّر المفاتيح بانتظام

3. **الاختبار**
   - اختبر دائماً على Testnet أولاً
   - لا تستخدم أموال حقيقية حتى تتأكد
   - راقب المعاملات

---

## 🔐 الميزات الأمنية في المشروع

### العقود الذكية

- ✅ `ReentrancyGuard` - حماية من reentrancy attacks
- ✅ `Access Control` - Owner + Operator roles
- ✅ `Pausable` - إمكانية الإيقاف الطارئ
- ✅ `Rescue Functions` - استرجاع الأموال في الطوارئ
- ✅ `Input Validation` - التحقق من جميع المدخلات

### التطبيق

- ✅ لا تخزين للمفاتيح الخاصة
- ✅ Gasless Execution عبر Paymaster
- ✅ MEV Protection عبر Flashbots
- ✅ Slippage Protection
- ✅ Atomic Execution

### البنية التحتية

- ✅ Secrets مشفرة في GitHub
- ✅ HTTPS فقط
- ✅ Rate Limiting
- ✅ Input Sanitization

---

## 🚨 الاستجابة للحوادث

### في حالة اختراق

1. **أوقف التطبيق فوراً**
   ```bash
   # أوقف الخادم
   pm2 stop all
   
   # أو على Vercel
   vercel --prod --force
   ```

2. **قيّم الضرر**
   - راجع السجلات
   - تحقق من المعاملات
   - حدد نطاق الاختراق

3. **أصلح الثغرة**
   - حدّد السبب
   - أصلح المشكلة
   - اختبر الإصلاح

4. **أبلغ المستخدمين**
   - كن شفافاً
   - اشرح ما حدث
   - قدّم خطوات الحماية

### العقود الذكية المخترقة

```solidity
// أوقف العقد فوراً
await contract.setPaused(true);

// استرجع الأموال
await contract.rescueTokens(tokenAddress, amount);
await contract.rescueETH();

// انشر عقد جديد
// حدّث العناوين في .env
// اختبر جيداً قبل الإنتاج
```

---

## 📚 موارد أمنية

### أدوات

- **Slither:** تحليل ثابت للعقود الذكية
- **Mythril:** اكتشاف الثغرات
- **Echidna:** fuzzing للعقود
- **TruffleHog:** البحث عن الأسرار

### قوائم مراجعة

- [Smart Contract Security Checklist](https://github.com/crytic/properties)
- [DeFi Security Checklist](https://defichecklist.com/)
- [Web3 Security Guide](https://github.com/OffcierCia/DeFi-Developer-Road-Map)

### قراءة

- [Reentrancy Patterns](https://github.com/crytic/not-so-smart-contracts)
- [Common Vulnerabilities](https://swcregistry.io/)
- [Audit Reports](https://github.com/crytic/properties)

---

## 🏆 Hall of Fame

نشكر الباحثين الأمنيين الذين ساعدونا:

- (سيتم إضافة الأسماء هنا)

---

## 📞 التواصل

- **Email:** security@cryptoarbpro.com
- **PGP Key:** [تحميل المفتاح](security.asc)
- **GitHub Security Advisories:** [إنشاء advisory](../../security/advisories/new)

---

## 📝 التحديثات

| التاريخ | الإصدار | التغييرات |
|---------|---------|-----------|
| 2026-05-30 | 1.0.0 | الإصدار الأول |

---

<div align="center">

**الأمان أولاً! 🛡️**

</div>
