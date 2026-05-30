# 🚀 البدء السريع - Crypto Arbitrage Pro

<div align="center">

### ابدأ في 5 دقائق فقط!

</div>

---

## ⚡ البدء السريع (5 دقائق)

### 1️⃣ تثبيت الاعتماديات (2 دقيقة)

```bash
cd crypto-arb-pro
npm install
```

### 2️⃣ إعداد المتغيرات البيئية (2 دقيقة)

```bash
# انسخ ملف المثال
cp .env.example .env

# عدّل .env وأضف:
# - ALCHEMY_API_KEY (من alchemy.com - مجاني)
# - PRIVATE_KEY (من MetaMask)
# - WALLET_ADDRESS (عنوان محفظتك)
# - BICONOMY_API_KEY (من biconomy.io - مجاني)
```

### 3️⃣ تشغيل المشروع (1 دقيقة)

```bash
npm run dev:all
```

### 4️⃣ افتح المتصفح

```
http://localhost:3000
```

**🎉 مبروك!** التطبيق يعمل الآن.

---

## 📚 الخطوات التالية

### للاختبار (مجاني 100%)

```bash
# 1. احصل على ETH اختباري مجاني
# https://faucet.quicknode.com/arbitrum/sepolia

# 2. انشر العقود على Testnet
npx hardhat run scripts/deploy.js --network arbitrumSepolia

# 3. اختبر البوت
npm run server
```

### للإنتاج (Mainnet)

```bash
# 1. انشر العقود على Arbitrum One
npx hardhat run scripts/deploy.js --network arbitrumOne

# 2. حدّث .env بالعناوين الجديدة

# 3. شغّل البوت
npm run dev:all
```

---

## 📖 التوثيق الكامل

- 📘 [دليل التنفيذ الشامل](IMPLEMENTATION_GUIDE.md) - كل التفاصيل
- 📗 [دليل GitHub](GITHUB_GUIDE.md) - النشر على GitHub
- 📕 [دليل المساهمة](CONTRIBUTING.md) - للمساهمين
- 📙 [سجل التغييرات](CHANGELOG.md) - تاريخ الإصدارات

---

## 🆘 المساعدة السريعة

### المشكلة: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### المشكلة: "Insufficient funds"
```bash
# احصل على ETH اختباري من:
# https://faucet.quicknode.com/arbitrum/sepolia
```

### المشكلة: "No opportunities found"
```bash
# هذا طبيعي! انتظر بضع دقائق
# أو قلل minProfit في scanner.js
```

---

## 🎯 الميزات الرئيسية

✅ **12 DEX مدعوم** - Uniswap, SushiSwap, Curve, Balancer...  
✅ **3 استراتيجيات** - Flash Loan, Flash Swap, Flash Mint  
✅ **Gasless Execution** - الغاز يُدفع من الأرباح  
✅ **MEV Protection** - حماية من Front-running  
✅ **Real-time Scanner** - مسح كل 3 ثوانٍ  
✅ **Professional UI** - واجهة احترافية  

---

## 💡 نصيحة مهمة

**ابدأ دائماً على Testnet!**

- ✅ مجاني 100%
- ✅ لا مخاطرة
- ✅ تعلم بدون ضغط
- ✅ اختبر كل الميزات

---

<div align="center">

**جاهز؟ لنبدأ! 🚀**

```bash
npm run dev:all
```

</div>
