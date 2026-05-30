# 🚀 دليل النشر السريع على GitHub

<div align="center">

### انشر مشروعك على GitHub في دقيقتين فقط!

</div>

---

## ⚡ الطريقة الأسهل: سكريبت تلقائي

### الخطوة 1: ثبّت GitHub CLI (مرة واحدة فقط)

```powershell
winget install --id GitHub.cli
```

أو حمّل من: https://cli.github.com/

### الخطوة 2: سجّل الدخول (مرة واحدة فقط)

```powershell
gh auth login
```

اتبع التعليمات:
- اختر `GitHub.com`
- اختر `HTTPS`
- اختر `Login with a web browser`
- أكمل التسجيل في المتصفح

### الخطوة 3: شغّل سكريبت النشر

```powershell
cd "F:\Open Code Projet\Projet A1\crypto-arb-pro"
.\deploy-to-github.ps1
```

**🎉 هذا كل شيء!** السكريبت سيقوم بـ:

- ✅ التحقق من المتطلبات
- ✅ التحقق من المصادقة
- ✅ تهيئة Git
- ✅ إنشاء Repository على GitHub
- ✅ رفع الكود
- ✅ إضافة 15 Topic
- ✅ تفعيل Issues و Discussions
- ✅ إنشاء Release v1.0.0
- ✅ فتح المتصفح

---

## 🔧 الطريقة اليدوية (إذا فضّلت التحكم)

```powershell
cd "F:\Open Code Projet\Projet A1\crypto-arb-pro"

# 1. تهيئة Git
git init
git branch -M main
git add .
git commit -m "🎉 Initial commit: Crypto Arbitrage Pro"

# 2. إنشاء repo على GitHub
gh repo create crypto-arb-pro --public --source=. --push --description "⚡ Advanced Crypto Arbitrage Platform"

# 3. إضافة topics
gh repo edit --add-topic arbitrage --add-topic defi --add-topic flash-loans --add-topic ethereum --add-topic arbitrum --add-topic uniswap --add-topic aave --add-topic web3 --add-topic cryptocurrency --add-topic blockchain --add-topic nextjs --add-topic solidity --add-topic mev-protection --add-topic gasless --add-topic trading-bot

# 4. تفعيل الميزات
gh repo edit --enable-issues --enable-discussions --enable-projects --enable-wiki

# 5. إنشاء Release
gh release create v1.0.0 --title "v1.0.0 - Initial Release" --notes "First release of Crypto Arbitrage Pro"
```

---

## 🔐 بعد النشر: أضف GitHub Secrets

اذهب إلى: **Settings → Secrets and variables → Actions**

أضف هذه الأسرار:

| الاسم | الوصف | من أين تحصل عليه |
|-------|-------|------------------|
| `ALCHEMY_API_KEY` | RPC Provider | [alchemy.com](https://alchemy.com) |
| `PRIVATE_KEY` | مفتاح المحفظة الخاص | MetaMask |
| `WALLET_ADDRESS` | عنوان المحفظة | MetaMask |
| `BICONOMY_API_KEY` | Paymaster | [biconomy.io](https://biconomy.io) |
| `ARBISCAN_API_KEY` | Contract Verification | [arbiscan.io/apis](https://arbiscan.io/apis) |

---

## 📊 ما تم إنجازه

بعد تشغيل السكريبت، ستحصل على:

```
✅ Repository: github.com/YOUR_USERNAME/crypto-arb-pro
✅ 15 Topics: arbitrage, defi, flash-loans, ethereum...
✅ Release: v1.0.0
✅ Features: Issues, Discussions, Wiki, Projects
✅ CI/CD: 6 GitHub Actions workflows ready
✅ Documentation: 10 comprehensive guides
```

---

## 🎯 الخطوات التالية

1. **افتح المتصفح** على رابط الـ repo
2. **أضف Secrets** (انظر أعلاه)
3. **فعّل GitHub Actions** في Settings
4. **شارك المشروع** مع المجتمع!

---

## 🆘 حل المشاكل

### المشكلة: "gh: command not found"
```powershell
winget install --id GitHub.cli
# أعد فتح PowerShell
```

### المشكلة: "Not authenticated"
```powershell
gh auth login
```

### المشكلة: "Repository already exists"
```powershell
# استخدم اسماً مختلفاً
.\deploy-to-github.ps1 -RepoName "crypto-arb-pro-v2"
```

### المشكلة: "Permission denied"
```powershell
# شغّل PowerShell كمسؤول (Admin)
```

---

## 📝 خيارات السكريبت

```powershell
# اسم مخصص للـ repo
.\deploy-to-github.ps1 -RepoName "my-arb-bot"

# repo خاص (Private)
.\deploy-to-github.ps1 -Private

# بدون إنشاء Release
.\deploy-to-github.ps1 -SkipRelease

# كل الخيارات معاً
.\deploy-to-github.ps1 -RepoName "my-bot" -Private -SkipRelease
```

---

<div align="center">

**🎉 جاهز؟ شغّل الأمر الآن:**

```powershell
.\deploy-to-github.ps1
```

</div>
