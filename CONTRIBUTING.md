# 🤝 دليل المساهمة

شكراً لاهتمامك بالمساهمة في **Crypto Arbitrage Pro**! 🎉

هذا الدليل سيساعدك على فهم كيفية المساهمة في المشروع.

---

## 📋 جدول المحتويات

- [مدونة السلوك](#مدونة-السلوك)
- [كيف يمكنني المساهمة؟](#كيف-يمكنني-المساهمة)
- [الإبلاغ عن الأخطاء](#الإبلاغ-عن-الأخطاء)
- [اقتراح الميزات](#اقتراح-الميزات)
- [عملية المساهمة](#عملية-المساهمة)
- [معايير الكود](#معايير-الكود)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)

---

## مدونة السلوك

نحن نتبع [مدونة السلوك](CODE_OF_CONDUCT.md). بالمساهمة، أنت توافق على الالتزام بها.

---

## كيف يمكنني المساهمة؟

### 🐛 الإبلاغ عن الأخطاء

إذا وجدت خطأً:

1. **تحقق من Issues الموجودة** - ربما تم الإبلاغ عنه بالفعل
2. **أنشئ Issue جديد** باستخدام قالب Bug Report
3. **قدم معلومات مفصلة**:
   - خطوات إعادة الإنتاج
   - السلوك المتوقع vs الفعلي
   - لقطات شاشة (إذا أمكن)
   - معلومات البيئة (OS, Node.js, etc.)

### ✨ اقتراح الميزات

لديك فكرة لميزة جديدة؟

1. **تحقق من Issues الموجودة** - ربما تم اقتراحها بالفعل
2. **أنشئ Issue جديد** باستخدام قالب Feature Request
3. **اشرح الفائدة** - كيف ستفيد المستخدمين؟
4. **قدم أمثلة** - mockups أو أمثلة مشابهة

### 📝 تحسين التوثيق

التوثيق مهم جداً! يمكنك:

- إصلاح أخطاء إملائية
- إضافة أمثلة
- توضيح نقاط غامضة
- ترجمة التوثيق

### 💻 المساهمة بالكود

إذا كنت تريد المساهمة بالكود:

1. **اختر Issue** - ابحث عن issues مع label `good first issue`
2. **علق على Issue** - أخبرنا أنك تعمل عليه
3. **اتبع عملية المساهمة** - انظر أدناه

---

## عملية المساهمة

### 1. Fork المشروع

```bash
# على GitHub، اضغط "Fork"
# ثم استنسخ نسختك
git clone https://github.com/YOUR_USERNAME/crypto-arb-pro.git
cd crypto-arb-pro
```

### 2. أضف Remote الأصلي

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/crypto-arb-pro.git
```

### 3. أنشئ فرع جديد

```bash
# تأكد أنك على أحدث نسخة
git checkout main
git pull upstream main

# أنشئ فرع للميزة
git checkout -b feat/your-feature-name

# أو فرع لإصلاح خطأ
git checkout -b fix/your-bug-fix
```

### 4. اعمل على التغييرات

- اكتب كود نظيف ومقروء
- أضف اختبارات إذا لزم الأمر
- حدّث التوثيق إذا لزم الأمر

### 5. اختبر التغييرات

```bash
# شغّل الاختبارات
npm test

# شغّل Linter
npm run lint

# اختبر محلياً
npm run dev:all
```

### 6. أنشئ Commit

```bash
git add .
git commit -m "🎉 feat: إضافة ميزة جديدة"
```

**استخدم Conventional Commits:**

- `🎉 feat:` ميزة جديدة
- `🐛 fix:` إصلاح خطأ
- `📝 docs:` تحديث التوثيق
- `♻️ refactor:` إعادة هيكلة
- `⚡ perf:` تحسين الأداء
- `✅ test:` إضافة اختبارات
- `🔧 chore:` مهام صيانة

### 7. ارفع الفرع

```bash
git push origin feat/your-feature-name
```

### 8. أنشئ Pull Request

1. اذهب إلى GitHub
2. اضغط "Compare & pull request"
3. املأ قالب PR بالكامل
4. انتظر المراجعة

---

## معايير الكود

### JavaScript/TypeScript

```javascript
// ✅ جيد
const calculateProfit = (buyPrice, sellPrice, amount) => {
  const profit = (sellPrice - buyPrice) * amount;
  return profit;
};

// ❌ سيء
const calc = (a, b, c) => {
  return (b - a) * c;
};
```

### Solidity

```solidity
// ✅ جيد
function executeArbitrage(
    address asset,
    uint256 amount,
    bytes calldata data
) external onlyOperator whenNotPaused nonReentrant {
    require(amount > 0, "Amount must be greater than 0");
    // ...
}

// ❌ سيء
function exec(address a, uint b, bytes calldata c) external {
    // ...
}
```

### التسمية

- **المتغيرات والدوال:** camelCase
- **الثوابت:** UPPER_SNAKE_CASE
- **العقود والكلاسات:** PascalCase
- **الملفات:** kebab-case

### التعليقات

```javascript
// أضف تعليقات فقط عندما يكون الكود غير واضح
// ❌ سيء
const x = 5; // تعيين x إلى 5

// ✅ جيد
// حساب الربح الصافي بعد خصم جميع الرسوم
const netProfit = grossProfit - fees - gasCost;
```

---

## Commit Messages

### الصيغة

```
<emoji> <type>: <description>

[optional body]

[optional footer]
```

### أمثلة

```bash
🎉 feat: إضافة دعم Uniswap V3 على Arbitrum

- إضافة Uniswap V3 Router
- تحديث ABIs
- إضافة اختبارات

Closes #42
```

```bash
🐛 fix: إصلاح حساب الربح عند استخدام Flash Mint

كان الربح يُحسب بشكل خاطئ عندما يكون fee = 0

Fixes #123
```

---

## Pull Requests

### قبل الإرسال

- [ ] راجعت الكود بنفسي
- [ ] أضفت اختبارات
- [ ] جميع الاختبارات تنجح
- [ ] التوثيق محدّث
- [ ] لا توجد أسرار في الكود

### قالب PR

استخدم القالب الموجود في `.github/PULL_REQUEST_TEMPLATE.md`

### بعد الإرسال

- كن متاحاً للأسئلة
- استجب للمراجعات بسرعة
- كن محترماً في النقاش

---

## 🏷️ Labels

نستخدم هذه الـ labels:

- `bug` - خطأ
- `enhancement` - ميزة جديدة
- `documentation` - توثيق
- `good first issue` - مناسب للمبتدئين
- `help wanted` - نحتاج مساعدة
- `question` - سؤال
- `wontfix` - لن يتم إصلاحه

---

## 📞 التواصل

- **GitHub Issues:** للأسئلة التقنية
- **Discord:** للنقاش العام
- **Email:** للأمور الخاصة

---

## 🙏 شكراً لك!

مساهماتك تجعل المشروع أفضل! 🎉

---

<div align="center">

**صُنع بـ ❤️ من مجتمع الكريبتو العربي**

</div>
