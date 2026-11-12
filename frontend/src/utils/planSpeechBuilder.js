import { DEFAULT_ELZORA_DOCUMENT, getDocumentSourceMeta } from './elzoraKnowledge'

const ELZORA_ENGLISH_LINES = [
  {
    type: 'heading',
    topic: 'package_overview',
    text: 'ELZORA Official A-to-Z Decentralized Business Plan & Earning Flow',
    spoken: 'Welcome to ELZORA. Here is the complete A to Z decentralized business plan and earning flow.',
  },
  {
    type: 'paragraph',
    topic: 'package_overview',
    text: 'ELZORA is an autonomous, 100% non-custodial Binary Matrix, 8-Rank Club Matrix, and Global Club ecosystem operating on BNB Smart Chain.',
    spoken: 'ELZORA is an autonomous, 100 percent non-custodial Binary Matrix, 8-Rank Club Matrix, and Global Club ecosystem operating on BNB Smart Chain.',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: 'One-Time Activation Package ($50 IN = $50 OUT): Join once with $50.00 USDT (BEP-20). There are zero monthly renewals and 100% of every $50 fee distributes instantly to member wallets.',
    spoken: 'Your one-time activation package is 50 dollars USDT. There are zero monthly renewals, and 100 percent of every 50 dollar activation distributes instantly to member wallets.',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: 'Zero Withdrawal Lock: There is no manual withdrawal button or central balance hold. Every earned commission settles straight into your connected wallet (MetaMask, Trust Wallet, SafePal, or TokenPocket).',
    spoken: 'There is no manual withdrawal button and no central balance hold. Every earned commission settles straight into your connected wallet automatically.',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: '7 Core Streams ($50 Package) + 1 Global Club ($25): Direct 20% ($10), 20-Level Affiliate 14% ($7), 8 Club Ranks 24% ($12), Binary Matching 20% ($10), Champion Royalty 6% ($3), Weekly Pool 6% ($3), 27 Milestones 10% ($5), plus the $25 Global Club.',
    spoken: 'The 50 dollar package splits across 7 core streams: 20 percent Direct, 14 percent 20-Level Affiliate, 24 percent 8 Club Ranks, 20 percent Binary Matching, 6 percent Champion Royalty, 6 percent Weekly Pool, and 10 percent Lifetime Milestones, alongside the separate 25 dollar Global Club.',
  },
  {
    type: 'subheading',
    topic: 'package_overview',
    text: 'Joining Flow, Wallet Setup & 30-Level Auto-Spillover Placement',
    spoken: 'Let us understand the joining flow, wallet setup, and 30-level auto-spillover placement.',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: '2-Step Joining Flow: Hold $50 USDT (BEP-20) plus ~$0.10 BNB network gas, approve USDT spending on the Register page, and confirm placement under your Sponsor on the Left or Right leg.',
    spoken: 'To join, hold 50 dollars BEP-20 USDT plus around 10 cents of BNB for network gas, approve USDT on the Register page, and confirm your Left or Right placement under your sponsor.',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: '30-Level Auto-Spillover & Immutable Lineage: If your Sponsor’s Left or Right spot is full, the system automatically finds the nearest vacant leaf down 30 levels. Once confirmed, Sponsor, Parent, and Position remain permanent.',
    spoken: 'If your sponsor’s chosen Left or Right spot is full, auto-spillover automatically places the member in the nearest vacant leaf down 30 levels, and lineage remains permanent.',
  },
  {
    type: 'subheading',
    topic: 'direct_affiliate',
    text: 'Stream 1 & 2: Direct Referral (20% = $10) & 20-Level Affiliate (14% = $7)',
    spoken: 'Now let us explore Streams 1 and 2: Direct Referral Commission and 20-Level Network Affiliate Income.',
  },
  {
    type: 'bullet',
    topic: 'direct_affiliate',
    text: 'Direct Referral Commission (20% = $10.00): Receive $10.00 USDT instantly to your wallet on every personal referral activation with zero cap on unlimited directs.',
    spoken: 'Direct Referral Commission pays 20 percent, equal to 10 dollars USDT, instantly to your wallet for every direct referral, with no limit on how many directs you sponsor.',
  },
  {
    type: 'bullet',
    topic: 'direct_affiliate',
    text: '20-Level Affiliate Breakdown (14% = $7.00): Follows your personal Sponsor chain (independent of binary spillover). Levels 1 to 10 pay $0.40 per level ($4.00 total), and Levels 11 to 20 pay $0.30 per level ($3.00 total).',
    spoken: '20-Level Network Affiliate follows your personal sponsor chain for 20 generations. Levels 1 through 10 pay 40 cents per level, and Levels 11 through 20 pay 30 cents per level, totaling 7 dollars.',
  },
  {
    type: 'subheading',
    topic: 'binary_matching',
    text: 'Stream 4: 1:1 Binary Matching Pool (20% = $10) & Perpetual Carry-Forward',
    spoken: 'Next is Stream 4: the 1 to 1 Binary Matching Pool with perpetual carry-forward.',
  },
  {
    type: 'bullet',
    topic: 'binary_matching',
    text: 'Binary Pair Payout ($2.00 / Pair): Every 1 Left and 1 Right activation across infinite binary depth matches into a pair paying $2.00 USDT instantly.',
    spoken: 'Every 1 Left and 1 Right team activation across infinite depth forms a pair paying 2 dollars USDT instantly.',
  },
  {
    type: 'bullet',
    topic: 'binary_matching',
    text: 'Qualification Rule (1 Left + 1 Right Direct): You must personally sponsor at least 1 active Left direct and 1 active Right direct to unlock binary pair payouts (spillover builds volume, not direct qualification).',
    spoken: 'To qualify for binary matching payouts, you must personally sponsor at least 1 active Left direct and 1 active Right direct.',
  },
  {
    type: 'bullet',
    topic: 'binary_matching',
    text: 'Daily Cap & Zero Flush: Standard cap is 50 pairs per day ($100.00/day or $3,000/month), resetting at 00:00 UTC. Unmatched power-leg volume and excess pairs carry forward perpetually and never flush.',
    spoken: 'The standard daily cap is 50 pairs, equal to 100 dollars per day, resetting at midnight UTC. Unmatched power-leg volume never flushes and carries forward perpetually.',
  },
  {
    type: 'subheading',
    topic: 'club_matrices',
    text: 'Stream 3: 8 Cascading Club Rank Matrices (24% = $12.00) — $9,874,567 Net Potential',
    spoken: 'Now let us review Stream 3: the 8 Cascading Club Rank Matrices, offering over 9.87 million dollars in cumulative net profit.',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'Ranks #1 to #4: Join at #1 Starter (2 team -> $24 Gross, $14 Upgrade, $10 Net), advance to #2 Leader (4 team -> $56 Gross, $30 Upgrade, $26 Net), #3 Achiever (8 team -> $240 Gross, $96 Upgrade, $24 Sponsor, $120 Net), and #4 Mentor (16 team -> $1,536 Gross, $500 Upgrade, $125 Sponsor, $911 Net).',
    spoken: 'Every member starts at Rank 1 Starter with 10 dollars net profit, then auto-upgrades to Leader with 26 dollars net, Achiever with 120 dollars net, and Mentor with 911 dollars net profit.',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'Ranks #5 to #8: Progress to #5 Director (32 team -> $9,750 Net, $1,250 Sponsor), #6 Elite (64 team -> $301,250 Net, $3,750 Sponsor), #7 Crown (128 team -> $1,882,500 Net, $7,500 Sponsor), and #8 Legend (256 team -> $7,680,000 Net + Re-top Up Cycle).',
    spoken: 'Higher ranks scale to Director with 9,750 dollars net, Elite with 301,250 dollars net, Crown with 1 million 882 thousand 500 dollars net, and Legend with 7 million 680 thousand dollars net plus an automatic re-top up cycle.',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'Total Club Ranks & Sponsor Bonuses: All upgrades happen automatically from matrix earnings with zero extra pocket cost, delivering $9,874,567 total net profit and $12,649 in Sponsor Bonuses across Ranks 3 to 7.',
    spoken: 'All upgrades happen automatically from matrix earnings with zero out-of-pocket fees, totaling 9 million 874 thousand 567 dollars net profit and 12,649 dollars in sponsor bonuses.',
  },
  {
    type: 'subheading',
    topic: 'club_matrices',
    text: 'Stream 5 & 6: Champion Royalty (6% = $3) & Weekly Performance Pool (6% = $3)',
    spoken: 'Next are Streams 5 and 6: the Monthly Champion Royalty Pool and the Weekly Performance Pool.',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'Champion Club Royalty (6% = $3.00): Accumulates $3.00 per activation over 30-day monthly epochs and distributes equally to lifetime leaders with 30 direct active referrals.',
    spoken: 'Champion Club Royalty collects 3 dollars per activation over 30-day monthly epochs and divides equally among permanent qualifiers with 30 direct referrals.',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'Weekly Performance Pool (6% = $3.00): Accumulates $3.00 per activation from Sunday 00:00 UTC to Saturday 23:59 UTC and pays equally every Sunday to members who sponsor 3 directs during that week.',
    spoken: 'Weekly Performance Pool collects 3 dollars per activation from Sunday to Saturday and distributes equally every Sunday to members who sponsor 3 directs that week.',
  },
  {
    type: 'subheading',
    topic: 'club_matrices',
    text: 'Stream 7: 27 Lifetime Milestone Rewards (10% = $5.00) — $123,098,800 Total',
    spoken: 'Now let us look at Stream 7: the 27 non-expiring Lifetime Milestone Rewards.',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'Milestones M1–M10: Start at M1 (5L/5R -> $25), M2 (20L/20R -> $75), M3 (50L/50R -> $150), M4 (100L/100R -> $300), M5 (250L/250R -> $750) with 1 direct, up to M10 (8,000L/8,000R -> $25,000) with 2 directs.',
    spoken: 'Milestones 1 to 10 start at 25 dollars for 5 Left and 5 Right team members with 1 direct, scaling up to 25,000 dollars at Milestone 10 with 2 directs.',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'Milestones M11–M27 & Safe-Wait Rule: Scale from $50,000 at M11 (3 directs) through M27 (7,000,000L/7,000,000R -> $21,000,000 with 6 directs). Unmet direct counts wait safely forever without expiring or diverting.',
    spoken: 'Milestones 11 through 27 scale from 50,000 dollars up to 21 million dollars at Milestone 27 with 6 directs. Unmet direct counts wait safely without ever expiring.',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'Milestone 1 Auto-Global-Club Bonus: Completing M1 ($25) automatically activates your $25 Global Club seat for free if not already active — or pays $25 USDT directly to your wallet if you already joined.',
    spoken: 'When you unlock Milestone 1, its 25 dollar reward automatically activates your Global Club seat for free if not yet joined, or pays 25 dollars straight to your wallet if you already joined.',
  },
  {
    type: 'subheading',
    topic: 'single_leg',
    text: 'Stream 8: $25 Single Leg / Global Club — Autonomous 1-to-2 Re-Entry Queue',
    spoken: 'Now Stream 8: the 25 dollar Single Leg Global Club autonomous re-entry queue.',
  },
  {
    type: 'bullet',
    topic: 'single_leg',
    text: 'Dual Entry & FIFO Cycle: Join manually for $25 USDT or auto-activate at Milestone 1. Whenever 2 new global entries join behind your queue spot, you earn $25.00 USDT instant profit plus 1 free automatic re-entry at the queue tail.',
    spoken: 'Join manually for 25 dollars or auto-activate at Milestone 1. Whenever 2 new global entries join behind your spot, you receive 25 dollars instant profit plus 1 automatic re-entry at the end of the queue.',
  },
  {
    type: 'subheading',
    topic: 'break_even',
    text: 'Break-Even Math, Treasury Rules & Non-Custodial Protection',
    spoken: 'Finally, let us review practical break-even math, treasury rules, and non-custodial member protection.',
  },
  {
    type: 'bullet',
    topic: 'break_even',
    text: '2 Balanced Directs (1L + 1R): $20 Direct + $0.80 L1 Affiliate + $2 Binary Pair + $10 Starter Net = $32.80 USDT instant recovery (65.6% back).',
    spoken: 'With 2 balanced directs, 1 Left and 1 Right, you instantly earn 32 dollars and 80 cents USDT, recovering 65.6 percent right away.',
  },
  {
    type: 'bullet',
    topic: 'break_even',
    text: '3 Directs in 1 Week & 5 Directs Break-Even: 3 weekly directs yield $43.20 USDT instant plus Sunday’s Weekly Performance Pool share; 5 directs deliver $50 Direct alone (100% fee recovery) plus Affiliate, Binary, and Club profits.',
    spoken: '3 directs in 1 week earn 43 dollars 20 cents instant plus a Weekly Pool share. 5 directs deliver 50 dollars in direct commission alone for 100 percent break-even plus extra bonuses.',
  },
  {
    type: 'bullet',
    topic: 'break_even',
    text: 'Treasury 4-Case Rules: Funds route to the Treasury Reserve only for empty/inactive 20-level uplines, binary pairs before 1L+1R directs, inactive Club Rank 3–7 sponsors, or epochs with zero qualifiers — never from Lifetime Milestones.',
    spoken: 'Funds route to Treasury only in 4 cases: empty or inactive affiliate uplines, binary pairs before 1 Left and 1 Right direct, inactive rank sponsors, or pools with zero qualifiers.',
  },
  {
    type: 'bullet',
    topic: 'break_even',
    text: 'Complete Ecosystem: Track everything live across your Dashboard, Single Leg Club, Club Ranks, Binary Tree, Earnings History, and Referral Links — with Sentinel Guard AI and Kore Voice AI guiding every step.',
    spoken: 'Everything is transparent across your Dashboard, Single Leg Club, Club Ranks, Binary Tree, and Earnings History. Thank you for exploring the complete ELZORA business plan with Kore.',
  },
]

const ELZORA_HINDI_LINES = [
  {
    type: 'heading',
    topic: 'package_overview',
    text: 'ELZORA संपूर्ण A-to-Z डिसेंट्रलाइज़्ड बिज़नेस प्लान और अर्निंग फ्लो',
    spoken: 'ELZORA में आपका स्वागत है। आइए पूरे A to Z डिसेंट्रलाइज़्ड बिज़नेस प्लान और अर्निंग फ्लो को विस्तार से समझते हैं।',
  },
  {
    type: 'paragraph',
    topic: 'package_overview',
    text: 'ELZORA BNB स्मार्ट चेन पर आधारित एक स्वायत्त, 100% नॉन-कस्टोडियल बाइनरी मैट्रिक्स, 8-रैंक क्लब मैट्रिक्स और ग्लोबल क्लब इकोसिस्टम है।',
    spoken: 'ELZORA BNB स्मार्ट चेन पर आधारित एक 100 प्रतिशत नॉन-कस्टोडियल बाइनरी मैट्रिक्स, 8 रैंक क्लब मैट्रिक्स और ग्लोबल क्लब इकोसिस्टम है।',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: 'वन-टाइम एक्टिवेशन पैकेज ($50 IN = $50 OUT): केवल एक बार $50.00 USDT (BEP-20) से जुड़ें। कोई मासिक रिन्यूअल नहीं है और हर $50 का 100% हिस्सा तुरंत मेंबर्स के वॉलेट में बंटता है।',
    spoken: 'इसकी वन-टाइम एक्टिवेशन फीस केवल 50 डॉलर USDT है। कोई मासिक शुल्क नहीं है और हर 50 डॉलर का 100 प्रतिशत हिस्सा तुरंत मेंबर्स के वॉलेट में वितरित होता है।',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: 'ज़ीरो विथड्रॉल लॉक: इसमें कोई मैनुअल विथड्रॉल बटन या सेंट्रल फंड होल्ड नहीं है। हर कमाई सीधे आपके कनेक्टेड वॉलेट (MetaMask, Trust Wallet, SafePal, TokenPocket) में तुरंत पहुंचती है।',
    spoken: 'इसमें कोई विथड्रॉल बटन या बैलेंस लॉक नहीं है। हर कमीशन तुरंत आपके कनेक्टेड BSC वॉलेट में सीधे ट्रांसफर होता है।',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: '7 मुख्य स्ट्रीम्स ($50 पैकेज) + 1 ग्लोबल क्लब ($25): डायरेक्ट 20% ($10), 20-लेवल एफिलिएट 14% ($7), 8 क्लब रैंक 24% ($12), बाइनरी मैचिंग 20% ($10), चैंपियन रॉयल्टी 6% ($3), साप्ताहिक पूल 6% ($3), 27 माइलस्टोन 10% ($5) और $25 ग्लोबल क्लब।',
    spoken: '50 डॉलर पैकेज 7 मुख्य स्ट्रीम्स में बंटता है: 20 प्रतिशत डायरेक्ट, 14 प्रतिशत 20-लेवल एफिलिएट, 24 प्रतिशत 8 क्लब रैंक, 20 प्रतिशत बाइनरी, 6 प्रतिशत चैंपियन रॉयल्टी, 6 प्रतिशत साप्ताहिक पूल और 10 प्रतिशत माइलस्टोन, साथ ही अलग से 25 डॉलर ग्लोबल क्लब।',
  },
  {
    type: 'subheading',
    topic: 'package_overview',
    text: 'जॉइनिंग प्रोसेस, वॉलेट सेटअप और 30-लेवल ऑटो-स्पिलओवर नियम',
    spoken: 'अब समझते हैं जॉइनिंग प्रोसेस, वॉलेट सेटअप और 30-लेवल ऑटो-स्पिलओवर नियम।',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: '2-स्टेप जॉइनिंग फ्लो: वॉलेट में $50 USDT (BEP-20) और ~$0.10 BNB गैस रखें, Register पेज पर USDT अप्रूव करें और अपने स्पॉन्सर के Left या Right लेग में एक्टिवेशन कन्फर्म करें।',
    spoken: 'जुड़ने के लिए वॉलेट में 50 डॉलर USDT और लगभग 10 सेंट BNB गैस रखें, Register पेज पर अप्रूव करें और स्पॉन्सर के Left या Right लेग में एक्टिवेट करें।',
  },
  {
    type: 'bullet',
    topic: 'package_overview',
    text: '30-लेवल ऑटो-स्पिलओवर और स्थायी प्लेसमेंट: यदि स्पॉन्सर की Left या Right सीट भरी है, तो सिस्टम स्वतः 30 लेवल नीचे तक खाली सीट ढूंढकर प्लेसमेंट करता है। एक बार तय स्पॉन्सर और पोजीशन स्थायी रहते हैं।',
    spoken: 'यदि स्पॉन्सर की सीट भरी हो, तो ऑटो-स्पिलओवर 30 लेवल नीचे तक सबसे नजदीकी खाली स्थान पर ऑटो-प्लेसमेंट कर देता है।',
  },
  {
    type: 'subheading',
    topic: 'direct_affiliate',
    text: 'स्ट्रीम 1 और 2: डायरेक्ट रेफरल (20% = $10) और 20-लेवल एफिलिएट (14% = $7)',
    spoken: 'अब स्ट्रीम 1 और 2 यानी डायरेक्ट रेफरल और 20-लेवल नेटवर्क एफिलिएट को समझते हैं।',
  },
  {
    type: 'bullet',
    topic: 'direct_affiliate',
    text: 'डायरेक्ट रेफरल कमीशन (20% = $10.00): आपके लिंक से जुड़ने वाले हर नए मेंबर पर तुरंत $10.00 USDT सीधे आपके वॉलेट में आते हैं। अनलिमिटेड डायरेक्ट जोड़े जा सकते हैं।',
    spoken: 'डायरेक्ट रेफरल में हर नई जॉइनिंग पर तुरंत 10 डॉलर USDT आपके वॉलेट में आते हैं और आप अनलिमिटेड डायरेक्ट कर सकते हैं।',
  },
  {
    type: 'bullet',
    topic: 'direct_affiliate',
    text: '20-लेवल नेटवर्क एफिलिएट (14% = $7.00): यह आपकी पर्सनल स्पॉन्सर चेन के 20 लेवल तक जाता है — लेवल 1 से 10 तक $0.40 प्रति लेवल ($4.00) और लेवल 11 से 20 तक $0.30 प्रति लेवल ($3.00)।',
    spoken: '20-लेवल एफिलिएट आपकी पर्सनल स्पॉन्सर चेन में बंटता है: लेवल 1 से 10 तक 40 सेंट प्रति लेवल और लेवल 11 से 20 तक 30 सेंट प्रति लेवल, कुल 7 डॉलर।',
  },
  {
    type: 'subheading',
    topic: 'binary_matching',
    text: 'स्ट्रीम 4: 1:1 बाइनरी मैचिंग पूल (20% = $10) और पर्पेचुअल कैरी फॉरवर्ड',
    spoken: 'अब देखते हैं स्ट्रीम 4 यानी 1 टू 1 बाइनरी मैचिंग पूल।',
  },
  {
    type: 'bullet',
    topic: 'binary_matching',
    text: 'बाइनरी पेयर दर ($2.00 / पेयर): अनंत गहराई तक Left और Right के हर 1:1 मैचिंग पेयर पर तुरंत $2.00 USDT सीधे वॉलेट में मिलता है।',
    spoken: 'अनंत गहराई तक हर 1 Left और 1 Right मैचिंग पेयर पर तुरंत 2 डॉलर USDT मिलते हैं।',
  },
  {
    type: 'bullet',
    topic: 'binary_matching',
    text: 'योग्यता नियम (1 Left + 1 Right डायरेक्ट): बाइनरी मैचिंग लेने के लिए कम से कम 1 सक्रिय Left डायरेक्ट और 1 सक्रिय Right डायरेक्ट होना अनिवार्य है (स्पिलओवर से वॉल्यूम बनता है, डायरेक्ट योग्यता नहीं)।',
    spoken: 'बाइनरी इनकम अनलॉक करने के लिए कम से कम 1 सक्रिय Left डायरेक्ट और 1 सक्रिय Right डायरेक्ट होना आवश्यक है।',
  },
  {
    type: 'bullet',
    topic: 'binary_matching',
    text: 'डेली कैप और ज़ीरो फ्लश: मानक दैनिक सीमा 50 पेयर ($100/दिन या $3,000/माह) है, जो 00:00 UTC पर रीसेट होती है। पावर लेग का बचा वॉल्यूम कभी फ्लश नहीं होता और हमेशा कैरी फॉरवर्ड रहता है।',
    spoken: 'मानक दैनिक सीमा 50 पेयर यानी 100 डॉलर प्रतिदिन है। पावर लेग का बचा हुआ वॉल्यूम कभी फ्लश नहीं होता और हमेशा कैरी फॉरवर्ड रहता है।',
  },
  {
    type: 'subheading',
    topic: 'club_matrices',
    text: 'स्ट्रीम 3: 8 कैस्केडिंग क्लब रैंक मैट्रिक्स (24% = $12.00) — $9,874,567 नेट लाभ',
    spoken: 'अब स्ट्रीम 3 यानी 8 कैस्केडिंग क्लब रैंक मैट्रिक्स को समझते हैं, जिसमें 98 लाख 74 हजार डॉलर से अधिक का नेट लाभ है।',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'रैंक #1 से #4: #1 Starter (2 टीम -> $10 नेट), #2 Leader (4 टीम -> $26 नेट), #3 Achiever (8 टीम -> $120 नेट, $24 स्पॉन्सर), और #4 Mentor (16 टीम -> $911 नेट, $125 स्पॉन्सर)।',
    spoken: 'हर मेंबर रैंक 1 स्टार्टर से शुरू होकर 10 डॉलर नेट पाता है, फिर लीडर पर 26 डॉलर, अचीवर पर 120 डॉलर और मेंटर पर 911 डॉलर नेट लाभ कमाता है।',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'रैंक #5 से #8: #5 Director (32 टीम -> $9,750 नेट, $1,250 स्पॉन्सर), #6 Elite (64 टीम -> $301,250 नेट, $3,750 स्पॉन्सर), #7 Crown (128 टीम -> $1,882,500 नेट, $7,500 स्पॉन्सर), और #8 Legend (256 टीम -> $7,680,000 नेट + री-टॉप अप साइकिल)।',
    spoken: 'आगे डायरेक्टर पर 9,750 डॉलर, एलीट पर 3 लाख 1 हजार 250 डॉलर, क्राउन पर 18 लाख 82 हजार 500 डॉलर और लीजेंड रैंक पर 76 लाख 80 हजार डॉलर नेट लाभ के साथ री-टॉप अप साइकिल मिलता है।',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'कुल क्लब लाभ और स्पॉन्सर बोनस: सभी अपग्रेड आपकी मैट्रिक्स कमाई से स्वतः होते हैं (जेब से कोई शुल्क नहीं), जिससे कुल $9,874,567 नेट लाभ और रैंक 3–7 में $12,649 स्पॉन्सर बोनस मिलता है।',
    spoken: 'सभी अपग्रेड ऑटोमैटिक होते हैं और कुल 98 लाख 74 हजार 567 डॉलर नेट लाभ तथा 12,649 डॉलर स्पॉन्सर बोनस मिलता है।',
  },
  {
    type: 'subheading',
    topic: 'club_matrices',
    text: 'स्ट्रीम 5 और 6: चैंपियन रॉयल्टी (6% = $3) और साप्ताहिक परफॉर्मेंस पूल (6% = $3)',
    spoken: 'अब स्ट्रीम 5 और 6 यानी चैंपियन रॉयल्टी और साप्ताहिक परफॉर्मेंस पूल को जानते हैं।',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'चैंपियन क्लब रॉयल्टी (6% = $3.00): हर रजिस्ट्रेशन से $3.00 जमा होकर 30-दिन मासिक पूल बनता है, जो 30 डायरेक्ट पूरा करने वाले स्थायी लीडर्स में बराबर बंटता है।',
    spoken: 'चैंपियन रॉयल्टी हर महीने 30 डायरेक्ट पूरा करने वाले लीडर्स में बराबर वितरित होती है।',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'साप्ताहिक परफॉर्मेंस पूल (6% = $3.00): रविवार 00:00 UTC से शनिवार 23:59 UTC तक एकत्र होकर हर रविवार उन मेंबर्स में बराबर बंटता है जिन्होंने उस सप्ताह 3 डायरेक्ट जोड़े हों।',
    spoken: 'साप्ताहिक परफॉर्मेंस पूल हर रविवार उन मेंबर्स में बराबर बंटता है जो उस सप्ताह कम से कम 3 डायरेक्ट करते हैं।',
  },
  {
    type: 'subheading',
    topic: 'club_matrices',
    text: 'स्ट्रीम 7: 27 लाइफटाइम माइलस्टोन रिवॉर्ड्स (10% = $5.00) — कुल $123,098,800',
    spoken: 'अब स्ट्रीम 7 यानी 27 लाइफटाइम माइलस्टोन रिवॉर्ड्स को देखते हैं।',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'माइलस्टोन M1–M10: M1 (5L/5R -> $25) से M5 (250L/250R -> $750) तक 1 डायरेक्ट, और M6–M10 (8,000L/8,000R -> $25,000) तक 2 डायरेक्ट की आवश्यकता होती है।',
    spoken: 'माइलस्टोन 1 से 5 तक 1 डायरेक्ट और 25 से 750 डॉलर तक का इनाम है, जबकि माइलस्टोन 6 से 10 तक 2 डायरेक्ट पर 25 हजार डॉलर तक मिलता है।',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'माइलस्टोन M11–M27 और सेफ-वेट नियम: M11 ($50,000, 3 डायरेक्ट) से बढ़कर M27 (70 लाख L/R -> $21,000,000, 6 डायरेक्ट) तक जाते हैं। डायरेक्ट पूरे न होने पर माइलस्टोन कभी एक्सपायर नहीं होता और सुरक्षित प्रतीक्षा करता है।',
    spoken: 'माइलस्टोन 11 से 27 तक 50 हजार डॉलर से बढ़कर 2 करोड़ 10 लाख डॉलर तक का इनाम है। डायरेक्ट पूरे होने तक यह सुरक्षित प्रतीक्षा करता है।',
  },
  {
    type: 'bullet',
    topic: 'club_matrices',
    text: 'माइलस्टोन 1 ऑटो-ग्लोबल-क्लब बोनस: M1 ($25) पूरा होने पर यदि आप ग्लोबल क्लब में नहीं हैं तो $25 से आपकी सीट मुफ्त एक्टिवेट हो जाती है, और पहले से जुड़े होने पर $25 सीधे वॉलेट में आते हैं।',
    spoken: 'माइलस्टोन 1 पूरा होने पर यदि आपका ग्लोबल क्लब सक्रिय नहीं है, तो यह अपने आप मुफ्त एक्टिवेट हो जाता है।',
  },
  {
    type: 'subheading',
    topic: 'single_leg',
    text: 'स्ट्रीम 8: $25 सिंगल लेग / ग्लोबल क्लब — स्वायत्त 1-इन-2 री-एंट्री क्यू',
    spoken: 'अब स्ट्रीम 8: 25 डॉलर सिंगल लेग ग्लोबल क्लब।',
  },
  {
    type: 'bullet',
    topic: 'single_leg',
    text: 'दोहरा प्रवेश और 1-इन-2 लूप: $25 USDT से मैनुअल जुड़ें या M1 पर मुफ्त ऑटो-एक्टिवेट हों। आपके बाद ग्लोबल क्यू में 2 नई एंट्री आने पर आपको तुरंत $25.00 USDT लाभ और क्यू के अंत में 1 ऑटो री-एंट्री मिलती है।',
    spoken: 'ग्लोबल क्यू में आपके बाद 2 नई एंट्री आने पर आपको तुरंत 25 डॉलर USDT लाभ और अंत में 1 नई ऑटो री-एंट्री मिलती है।',
  },
  {
    type: 'subheading',
    topic: 'break_even',
    text: 'ब्रेक-ईवन गणित, ट्रेजरी नियम और नॉन-कस्टोडियल सुरक्षा',
    spoken: 'अंत में आइए ब्रेक-ईवन गणित, ट्रेजरी नियम और नॉन-कस्टोडियल सुरक्षा को समझते हैं।',
  },
  {
    type: 'bullet',
    topic: 'break_even',
    text: '2 संतुलित डायरेक्ट (1L + 1R): $20 डायरेक्ट + $0.80 L1 एफिलिएट + $2 बाइनरी + $10 स्टार्टर नेट = $32.80 USDT तुरंत रिकवरी (65.6% वापसी)।',
    spoken: 'केवल 2 संतुलित डायरेक्ट पर तुरंत 32 डॉलर 80 सेंट USDT यानी 65.6 प्रतिशत रिकवरी हो जाती है।',
  },
  {
    type: 'bullet',
    topic: 'break_even',
    text: '1 सप्ताह में 3 डायरेक्ट और 5 डायरेक्ट पर 100% ब्रेक-ईवन: 3 साप्ताहिक डायरेक्ट पर $43.20 + रविवार को साप्ताहिक पूल हिस्सा, और 5 डायरेक्ट पर अकेले $50 डायरेक्ट कमीशन (100% वापसी) + अतिरिक्त बोनस मिलते हैं।',
    spoken: 'एक सप्ताह में 3 डायरेक्ट पर 43 डॉलर 20 सेंट के साथ साप्ताहिक पूल हिस्सा और 5 डायरेक्ट पर 100 प्रतिशत ब्रेक-ईवन पूरा हो जाता है।',
  },
  {
    type: 'bullet',
    topic: 'break_even',
    text: 'ट्रेजरी के 4 नियम: फंड केवल खाली/असक्रिय 20-लेवल अपलाइन, 1L+1R से पहले के बाइनरी पेयर, असक्रिय रैंक स्पॉन्सर या 0 क्वालिफायर वाले पूल में ही ट्रेजरी में जाता है — लाइफटाइम माइलस्टोन कभी नहीं जाते।',
    spoken: 'फंड केवल 4 स्थितियों में ही ट्रेजरी में जाता है, और लाइफटाइम माइलस्टोन कभी ट्रेजरी में नहीं जाते।',
  },
  {
    type: 'bullet',
    topic: 'break_even',
    text: 'संपूर्ण इकोसिस्टम: डैशबोर्ड, सिंगल लेग क्लब, क्लब रैंक, बाइनरी ट्री, अर्निंग हिस्ट्री, Sentinel Guard AI और Kore Voice AI के साथ हर आय लाइव ट्रैक करें।',
    spoken: 'आप डैशबोर्ड, क्लब रैंक, बाइनरी ट्री और अर्निंग हिस्ट्री में सब कुछ लाइव ट्रैक कर सकते हैं। ELZORA बिज़नेस प्लान सुनने के लिए धन्यवाद।',
  },
]

function sanitizeForSpeech(rawText, language = 'en') {
  const isHindi = language === 'hi'
  return String(rawText || '')
    .replace(/[*_`#>]/g, '')
    .replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, (_, num) =>
      isHindi ? `${num} डॉलर` : `${num} dollars`
    )
    .replace(/(\d+(?:\.\d+)?)%/g, (_, num) =>
      isHindi ? `${num} प्रतिशत` : `${num} percent`
    )
    .replace(/->|→/g, isHindi ? ' से ' : ' to ')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferTopicFromLine(text) {
  const lower = text.toLowerCase()
  if (lower.includes('single leg') || lower.includes('global club') || lower.includes('re-entry')) return 'single_leg'
  if (lower.includes('binary') || lower.includes('pair') || lower.includes('carry')) return 'binary_matching'
  if (lower.includes('club') || lower.includes('milestone') || lower.includes('starter') || lower.includes('legend')) return 'club_matrices'
  if (lower.includes('direct') || lower.includes('affiliate') || lower.includes('level')) return 'direct_affiliate'
  return 'package_overview'
}

function parseCustomDocumentLines(docText, language) {
  const rawLines = String(docText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const lines = []
  for (const raw of rawLines) {
    if (raw.startsWith('# ')) {
      const clean = raw.replace(/^#+\s*/, '')
      lines.push({
        type: 'heading',
        topic: inferTopicFromLine(clean),
        text: clean,
        spoken: sanitizeForSpeech(clean, language),
      })
    } else if (raw.startsWith('## ') || raw.startsWith('### ')) {
      const clean = raw.replace(/^#+\s*/, '')
      lines.push({
        type: 'subheading',
        topic: inferTopicFromLine(clean),
        text: clean,
        spoken: sanitizeForSpeech(clean, language),
      })
    } else if (/^[-*•]\s+/.test(raw) || /^\d+\.\s+/.test(raw)) {
      const clean = raw.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '')
      lines.push({
        type: 'bullet',
        topic: inferTopicFromLine(clean),
        text: clean,
        spoken: sanitizeForSpeech(clean, language),
      })
    } else {
      lines.push({
        type: 'paragraph',
        topic: inferTopicFromLine(raw),
        text: raw,
        spoken: sanitizeForSpeech(raw, language),
      })
    }
  }
  return lines
}

/**
 * Mirrors GET /ai/plan-explainer/speech?language=...
 */
export function buildDocumentLines(documentText, language = 'en') {
  const lang = language === 'hi' ? 'hi' : 'en'
  const meta = getDocumentSourceMeta()
  const isDefaultDoc = !meta.isCustom || String(documentText || '').trim() === DEFAULT_ELZORA_DOCUMENT.trim()

  const lines = isDefaultDoc
    ? (lang === 'hi' ? ELZORA_HINDI_LINES : ELZORA_ENGLISH_LINES)
    : parseCustomDocumentLines(documentText, lang)

  return {
    success: true,
    language: lang,
    total_lines: lines.length,
    lines,
    document_raw: documentText,
    document_title: meta.title || 'ELZORA Official Plan Specification',
  }
}

