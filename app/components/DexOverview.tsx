'use client';

const DEXES = [
  { id: 'uniswapV2', name: 'Uniswap V2', icon: '🦄', color: '#ff007a', chain: 'Ethereum', type: 'AMM V2', fee: '0.30%', tvl: '$4.2B', pairs: '20,000+', flashSwap: true },
  { id: 'uniswapV3_arb', name: 'Uniswap V3', icon: '🦄', color: '#ff007a', chain: 'Arbitrum', type: 'AMM V3', fee: '0.05-1%', tvl: '$1.8B', pairs: '5,000+', flashSwap: true },
  { id: 'sushiswap_arb', name: 'SushiSwap', icon: '🍣', color: '#e05baa', chain: 'Arbitrum', type: 'AMM V2', fee: '0.30%', tvl: '$320M', pairs: '2,500+', flashSwap: true },
  { id: 'camelot', name: 'Camelot', icon: '🐪', color: '#f5a623', chain: 'Arbitrum', type: 'AMM V2/V3', fee: '0.30%', tvl: '$180M', pairs: '800+', flashSwap: true },
  { id: 'pancakeswap_arb', name: 'PancakeSwap V3', icon: '🥞', color: '#d1884f', chain: 'Arbitrum', type: 'AMM V3', fee: '0.25%', tvl: '$90M', pairs: '400+', flashSwap: true },
  { id: 'traderjoe', name: 'TraderJoe', icon: '🧑‍🌾', color: '#23b0e5', chain: 'Arbitrum', type: 'Liquidity Book', fee: '0.30%', tvl: '$65M', pairs: '350+', flashSwap: false },
  { id: 'curve_3pool', name: 'Curve 3Pool', icon: '🌀', color: '#ff6b6b', chain: 'Ethereum', type: 'StableSwap', fee: '0.04%', tvl: '$1.5B', pairs: '3', flashSwap: false },
  { id: 'balancer_arb', name: 'Balancer', icon: '⚖️', color: '#1f5099', chain: 'Arbitrum', type: 'Weighted Pool', fee: '0.1-1%', tvl: '$120M', pairs: '200+', flashSwap: true },
  { id: 'gmx', name: 'GMX', icon: '🎲', color: '#4082f5', chain: 'Arbitrum', type: 'Perps/Spot', fee: '0.30%', tvl: '$450M', pairs: '25+', flashSwap: false },
  { id: 'ramses', name: 'Ramses', icon: '🏛️', color: '#c9a227', chain: 'Arbitrum', type: 'AMM V3', fee: '0.30%', tvl: '$35M', pairs: '150+', flashSwap: true },
  { id: 'chronos', name: 'Chronos', icon: '⏰', color: '#8b5cf6', chain: 'Arbitrum', type: 'AMM V2', fee: '0.30%', tvl: '$15M', pairs: '120+', flashSwap: true },
  { id: 'zyberswap', name: 'ZyberSwap', icon: '⚡', color: '#06b6d4', chain: 'Arbitrum', type: 'AMM V2/V3', fee: '0.25%', tvl: '$12M', pairs: '100+', flashSwap: true },
];

const FLASH_LOAN_PROVIDERS = [
  { name: 'Aave V3', icon: '👻', maxLoan: '$500M+', fee: '0.09%', tokens: '50+', chains: 'Arbitrum, Ethereum, Polygon, Optimism' },
  { name: 'MakerDAO Flash Mint', icon: '🏛️', maxLoan: '500M DAI', fee: '0%', tokens: 'DAI', chains: 'Ethereum' },
  { name: 'Uniswap V2 Flash Swap', icon: '🦄', maxLoan: 'Pool Liquidity', fee: '0.3%', tokens: 'All V2 Pairs', chains: 'Ethereum, Arbitrum' },
  { name: 'dYdX', icon: '📊', maxLoan: '$100M+', fee: '0%', tokens: 'Major', chains: 'Ethereum' },
  { name: 'Balancer Flash Loan', icon: '⚖️', maxLoan: 'Pool Balance', fee: '0%', tokens: 'All Balancer', chains: 'Ethereum, Arbitrum, Polygon' },
];

export function DexOverview() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <h2 className="text-lg font-bold mb-2">🏦 منصات DEX المدعومة</h2>
        <p className="text-sm text-gray-400 mb-4">
          نراقب الأسعار عبر {DEXES.length} منصة DEX للعثور على أفضل فرص الـ Arbitrage
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEXES.map((dex) => (
            <div
              key={dex.id}
              className="bg-dark-800 rounded-xl p-4 border border-dark-500 hover:border-opacity-50 transition-all hover:scale-[1.02]"
              style={{ borderColor: `${dex.color}33` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${dex.color}20` }}
                >
                  {dex.icon}
                </div>
                <div>
                  <h3 className="font-bold">{dex.name}</h3>
                  <p className="text-xs text-gray-500">{dex.chain} • {dex.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-dark-700 rounded-lg p-2">
                  <div className="text-gray-500">الرسوم</div>
                  <div className="font-mono font-bold">{dex.fee}</div>
                </div>
                <div className="bg-dark-700 rounded-lg p-2">
                  <div className="text-gray-500">TVL</div>
                  <div className="font-mono font-bold">{dex.tvl}</div>
                </div>
                <div className="bg-dark-700 rounded-lg p-2">
                  <div className="text-gray-500">الأزواج</div>
                  <div className="font-mono font-bold">{dex.pairs}</div>
                </div>
                <div className="bg-dark-700 rounded-lg p-2">
                  <div className="text-gray-500">Flash Swap</div>
                  <div className={`font-bold ${dex.flashSwap ? 'text-accent-green' : 'text-gray-500'}`}>
                    {dex.flashSwap ? '✅ مدعوم' : '❌'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4">
        <h2 className="text-lg font-bold mb-2">⚡ مزودو Flash Loans</h2>
        <p className="text-sm text-gray-400 mb-4">
          قروض فورية بدون ضمانات - تُسدد في نفس المعاملة
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FLASH_LOAN_PROVIDERS.map((provider) => (
            <div
              key={provider.name}
              className="bg-dark-800 rounded-xl p-4 border border-dark-500"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-2xl">
                  {provider.icon}
                </div>
                <div>
                  <h3 className="font-bold">{provider.name}</h3>
                  <p className="text-xs text-gray-500">{provider.chains}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">الحد الأقصى</span>
                  <span className="font-mono font-bold text-accent-cyan">{provider.maxLoan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">الرسوم</span>
                  <span className={`font-mono font-bold ${provider.fee === '0%' ? 'text-accent-green' : 'text-accent-orange'}`}>
                    {provider.fee}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">التوكنات</span>
                  <span className="font-mono">{provider.tokens}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4">
        <h2 className="text-lg font-bold mb-4">🛡️ استراتيجيات Arbitrage المدعومة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Simple DEX-DEX Arb', desc: 'شراء من DEX وبيع على آخر', icon: '🔄', difficulty: 'سهل', profit: '$5-500' },
            { name: 'Triangular Arb', desc: '3 مبادلات في مسار دائري', icon: '🔺', difficulty: 'متوسط', profit: '$10-1000' },
            { name: 'Cross-DEX Stablecoin', desc: 'استغلال فروق Stablecoins', icon: '💵', difficulty: 'سهل', profit: '$1-100' },
            { name: 'Multi-Hop Arb', desc: 'مسار معقد عبر 5+ DEXs', icon: '🔗', difficulty: 'صعب', profit: '$50-5000' },
            { name: 'Liquidation Arb', desc: 'تصفية القروض على Aave/Compound', icon: '🔨', difficulty: 'صعب', profit: '$100-10000' },
            { name: 'Flash Mint Arb', desc: 'استخدام DAI Flash Mint (0% رسوم)', icon: '🏛️', difficulty: 'متوسط', profit: '$20-2000' },
          ].map((strategy) => (
            <div key={strategy.name} className="bg-dark-800 rounded-xl p-4 border border-dark-500">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{strategy.icon}</span>
                <div>
                  <h3 className="font-bold">{strategy.name}</h3>
                  <p className="text-xs text-gray-500">{strategy.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="px-2 py-1 rounded bg-dark-700 text-gray-400">
                  الصعوبة: {strategy.difficulty}
                </span>
                <span className="px-2 py-1 rounded bg-accent-green/10 text-accent-green">
                  الربح: {strategy.profit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
