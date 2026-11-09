// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IElzora} from "./interfaces/IElzora.sol";

/**
 * @title ElzoraMain
 * @notice Core UUPS Upgradeable Business Logic Contract for ELZORA MLM & Binary Matrix Smart Contract System.
 * @dev Manages registrations, binary tree placement, 7-stream income distribution,
 * 8-rank cascading club matrix, Global Club $25 re-entry queue, and treasury solvency.
 */
contract ElzoraMain is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuard,
    UUPSUpgradeable,
    IElzora
{
    using SafeERC20 for IERC20;

    // --- Configuration Constants ---
    uint256 public constant REGISTRATION_USD = 50;
    uint256 public constant GLOBAL_CLUB_USD = 25;

    // Income allocations from $50 registration (in whole USD)
    uint256 public constant DIRECT_INCOME_USD = 10;     // 20% = $10
    uint256 public constant AFFILIATE_INCOME_USD = 7;   // 14% = $7
    uint256 public constant CLUB_INCOME_USD = 12;       // 24% = $12
    uint256 public constant MATCHING_INCOME_USD = 10;   // 20% = $10 ($2/pair)
    uint256 public constant CHAMPION_POOL_USD = 3;      // 6%  = $3
    uint256 public constant WEEKLY_POOL_USD = 3;        // 6%  = $3
    uint256 public constant LIFETIME_POOL_USD = 5;      // 10% = $5
    // Total = 10 + 7 + 12 + 10 + 3 + 3 + 5 = $50 (100%)

    uint256 public constant PAIR_RATE_USD = 2; // $2 per matched binary pair
    uint256 public constant MAX_DAILY_PAIRS = 50; // Daily cap: 50 pairs = $100/day
    // NOTE: Set to 3 for testing purposes; change back to 30 for production/mainnet deployment.
    uint256 public constant CHAMPION_DIRECTS_REQUIRED = 3;
    uint256 public constant WEEKLY_DIRECTS_REQUIRED = 3;
    uint256 public constant MAX_UPLINE_LEVELS = 20;

    // Time constants
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant SECONDS_PER_WEEK = 7 * 86400;
    // Sunday 00:00:00 UTC epoch anchor (Jan 4, 1970 was a Sunday)
    uint256 public constant WEEK_EPOCH_ANCHOR = 259200; // Thursday Jan 1 1970 + 3 days = Sunday Jan 4 1970

    // --- State Variables ---
    address public paymentToken;
    address public treasuryWallet;
    address public rootAddress;
    address public gatewayContract;

    uint256 public tokenUnit; // Scaled by paymentToken decimals (e.g. 1e6 for USDT)
    uint256 public totalUsers;
    uint256 public totalRegistrationVolume;
    uint256 public totalIncomeDistributed;
    uint256 public totalLiabilities;
    uint256 public systemStartTime;

    // User Mappings
    mapping(address => UserProfile) private _users;
    mapping(address => IncomeBreakdown) private _incomes;
    mapping(address => address[]) private _directReferrals;
    mapping(address => bool) public isAuthorizedGateway;

    // Binary Daily Matching Tracking
    mapping(address => mapping(uint256 => uint256)) public userDailyPairs;

    // Champion Club State (Monthly Batched Distribution)
    uint256 public championPoolBalance;
    address[] public championMembers;
    mapping(address => bool) public isChampionMember;

    struct ChampionMonthRecord {
        uint256 totalPool;
        uint256 totalMembers;
        uint256 rewardPerMember;
        uint256 distributedMembersCount;
        bool isSnapshotCreated;
        bool isFullyDistributed;
    }

    mapping(uint256 => ChampionMonthRecord) public championMonthlyRecords;
    mapping(uint256 => mapping(address => bool)) public hasReceivedChampionMonth;

    // Weekly Reward State (Weekly Batched Distribution)
    mapping(uint256 => uint256) public weeklyPoolBalance;
    mapping(uint256 => mapping(address => uint256)) public weeklyDirectCount;
    mapping(uint256 => address[]) private _weeklyQualifiers;
    mapping(uint256 => mapping(address => bool)) public isWeeklyQualifier;

    struct WeeklyEpochRecord {
        uint256 totalPool;
        uint256 totalQualifiers;
        uint256 rewardPerQualifier;
        uint256 distributedMembersCount;
        bool isSnapshotCreated;
        bool isFullyDistributed;
    }

    mapping(uint256 => WeeklyEpochRecord) public weeklyEpochRecords;
    mapping(uint256 => mapping(address => bool)) public hasReceivedWeeklyReward;

    // Lifetime Rewards Milestones (27 tiers)
    LifetimeMilestone[27] public lifetimeMilestones;
    mapping(address => mapping(uint256 => bool)) public hasClaimedMilestone;

    // Club Rank Progression (8 ranks: Starter to Legend)
    ClubRankConfig[8] public clubRanks;
    // Team member progression per user per rank: user => rankIndex => count of qualified team members
    mapping(address => mapping(uint256 => uint256)) public userClubProgress;
    mapping(address => mapping(uint256 => bool)) public userRankCompleted;

    // Global Club ($25 Re-entry System)
    GlobalClubEntryInfo[] public globalClubEntries;
    uint256 public globalClubQueueHead;
    mapping(address => uint256[]) private _userGlobalClubEntries;
    mapping(address => uint256) public userGlobalClubTotalCycles;

    // --- Modifiers ---
    modifier onlyAuthorized() {
        if (msg.sender != owner() && msg.sender != gatewayContract && !isAuthorizedGateway[msg.sender]) {
            revert Unauthorized();
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        address initialPaymentToken,
        address initialTreasury,
        address initialRoot
    ) external initializer {
        if (
            initialOwner == address(0) ||
            initialPaymentToken == address(0) ||
            initialTreasury == address(0) ||
            initialRoot == address(0)
        ) revert ZeroAddress();

        __Ownable_init(initialOwner);
        __Pausable_init();

        paymentToken = initialPaymentToken;
        treasuryWallet = initialTreasury;
        rootAddress = initialRoot;
        systemStartTime = block.timestamp;

        _updateTokenDecimals(initialPaymentToken);
        _initializeClubRanks();
        _initializeLifetimeMilestones();
        _initializeRootMember(initialRoot);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Initialization Helpers ---

    function _updateTokenDecimals(address token) internal {
        uint8 dec = IERC20Metadata(token).decimals();
        tokenUnit = 10 ** dec;
    }

    function _initializeClubRanks() internal {
        // Rank 1: Starter (2 members, gross $24, upgrade $14, sponsor $0, net $10)
        clubRanks[0] = ClubRankConfig("Starter", 2, 24, 14, 0, 10);
        // Rank 2: Leader (4 members, gross $56, upgrade $30, sponsor $0, net $26)
        clubRanks[1] = ClubRankConfig("Leader", 4, 56, 30, 0, 26);
        // Rank 3: Achiever (8 members, gross $240, upgrade $96, sponsor $24, net $120)
        clubRanks[2] = ClubRankConfig("Achiever", 8, 240, 96, 24, 120);
        // Rank 4: Mentor (16 members, gross $1,536, upgrade $500, sponsor $125, net $911)
        clubRanks[3] = ClubRankConfig("Mentor", 16, 1536, 500, 125, 911);
        // Rank 5: Director (32 members, gross $16,000, upgrade $5,000, sponsor $1,250, net $9,750)
        clubRanks[4] = ClubRankConfig("Director", 32, 16000, 5000, 1250, 9750);
        // Rank 6: Elite (64 members, gross $320,000, upgrade $15,000, sponsor $3,750, net $301,250)
        clubRanks[5] = ClubRankConfig("Elite", 64, 320000, 15000, 3750, 301250);
        // Rank 7: Crown (128 members, gross $1,920,000, upgrade $30,000, sponsor $7,500, net $1,882,500)
        clubRanks[6] = ClubRankConfig("Crown", 128, 1920000, 30000, 7500, 1882500);
        // Rank 8: Legend (256 members, gross $7,680,000, upgrade 0, sponsor 0, net $7,680,000)
        clubRanks[7] = ClubRankConfig("Legend", 256, 7680000, 0, 0, 7680000);
    }

    function _initializeLifetimeMilestones() internal {
        lifetimeMilestones[0] = LifetimeMilestone(5, 5, 25);
        lifetimeMilestones[1] = LifetimeMilestone(20, 20, 75);
        lifetimeMilestones[2] = LifetimeMilestone(50, 50, 150);
        lifetimeMilestones[3] = LifetimeMilestone(100, 100, 300);
        lifetimeMilestones[4] = LifetimeMilestone(250, 250, 750);
        lifetimeMilestones[5] = LifetimeMilestone(500, 500, 1500);
        lifetimeMilestones[6] = LifetimeMilestone(1000, 1000, 3000);
        lifetimeMilestones[7] = LifetimeMilestone(2000, 2000, 6000);
        lifetimeMilestones[8] = LifetimeMilestone(4000, 4000, 12000);
        lifetimeMilestones[9] = LifetimeMilestone(8000, 8000, 25000);
        lifetimeMilestones[10] = LifetimeMilestone(15000, 15000, 50000);
        lifetimeMilestones[11] = LifetimeMilestone(30000, 30000, 100000);
        lifetimeMilestones[12] = LifetimeMilestone(60000, 60000, 200000);
        lifetimeMilestones[13] = LifetimeMilestone(120000, 120000, 400000);
        lifetimeMilestones[14] = LifetimeMilestone(250000, 250000, 800000);
        lifetimeMilestones[15] = LifetimeMilestone(500000, 500000, 1500000);
        lifetimeMilestones[16] = LifetimeMilestone(1000000, 1000000, 3000000);
        lifetimeMilestones[17] = LifetimeMilestone(1500000, 1500000, 4500000);
        lifetimeMilestones[18] = LifetimeMilestone(2000000, 2000000, 6000000);
        lifetimeMilestones[19] = LifetimeMilestone(2500000, 2500000, 7500000);
        lifetimeMilestones[20] = LifetimeMilestone(3000000, 3000000, 9000000);
        lifetimeMilestones[21] = LifetimeMilestone(3500000, 3500000, 10500000);
        lifetimeMilestones[22] = LifetimeMilestone(4000000, 4000000, 12000000);
        lifetimeMilestones[23] = LifetimeMilestone(4500000, 4500000, 13500000);
        lifetimeMilestones[24] = LifetimeMilestone(5000000, 5000000, 15000000);
        lifetimeMilestones[25] = LifetimeMilestone(6000000, 6000000, 18000000);
        lifetimeMilestones[26] = LifetimeMilestone(7000000, 7000000, 21000000);
    }

    function _initializeRootMember(address root) internal {
        UserProfile storage u = _users[root];
        u.userAddress = root;
        u.sponsor = address(0);
        u.parent = address(0);
        u.isRegistered = true;
        u.currentRank = 1;

        totalUsers = 1;

        emit UserRegistered(root, address(0), address(0), BinaryPosition.None, block.timestamp);
    }

    // --- External Registration Functions ---

    function register(
        address sponsor,
        address parent,
        BinaryPosition position
    ) external whenNotPaused nonReentrant {
        _register(msg.sender, sponsor, parent, position);
    }

    function registerFor(
        address user,
        address sponsor,
        address parent,
        BinaryPosition position
    ) external whenNotPaused nonReentrant onlyAuthorized {
        if (user == address(0)) revert ZeroAddress();
        _register(user, sponsor, parent, position);
    }

    function _register(
        address user,
        address sponsor,
        address parent,
        BinaryPosition position
    ) internal {
        if (user == address(0) || sponsor == address(0) || parent == address(0)) revert ZeroAddress();
        if (_users[user].isRegistered) revert AlreadyRegistered();
        if (sponsor == user || parent == user) revert CannotSponsorSelf();
        if (!_users[sponsor].isRegistered) revert SponsorNotActive();
        if (!_users[parent].isRegistered) revert ParentNotActive();
        if (position != BinaryPosition.Left && position != BinaryPosition.Right) revert InvalidPosition();

        UserProfile storage pNode = _users[parent];
        if (position == BinaryPosition.Left) {
            if (pNode.leftChild != address(0)) revert PositionAlreadyOccupied();
            pNode.leftChild = user;
        } else {
            if (pNode.rightChild != address(0)) revert PositionAlreadyOccupied();
            pNode.rightChild = user;
        }

        _checkCircularReferral(user, sponsor);

        // Collect $50 USDT registration payment
        uint256 regFee = REGISTRATION_USD * tokenUnit;
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), regFee);

        // Initialize User Profile
        UserProfile storage u = _users[user];
        u.userAddress = user;
        u.sponsor = sponsor;
        u.parent = parent;
        u.position = position;
        u.isRegistered = true;
        u.currentRank = 1; // Starter

        totalUsers++;
        totalRegistrationVolume += regFee;

        // Update Sponsor Stats
        _users[sponsor].directCount++;
        _directReferrals[sponsor].push(user);

        // Check placement relative to sponsor to increment left/right direct counts
        if (_isUserInSubtree(user, _users[sponsor].leftChild)) {
            _users[sponsor].leftDirectCount++;
        } else {
            _users[sponsor].rightDirectCount++;
        }

        // Update Weekly Referral Counter
        uint256 currWeek = getCurrentWeeklyEpoch();
        weeklyDirectCount[currWeek][sponsor]++;
        if (weeklyDirectCount[currWeek][sponsor] == WEEKLY_DIRECTS_REQUIRED) {
            _weeklyQualifiers[currWeek].push(sponsor);
            isWeeklyQualifier[currWeek][sponsor] = true;
        }

        // Check Champion Club Qualification (30 directs)
        if (_users[sponsor].directCount >= CHAMPION_DIRECTS_REQUIRED && !isChampionMember[sponsor]) {
            isChampionMember[sponsor] = true;
            championMembers.push(sponsor);
        }

        // Update Binary Tree Placement Hierarchy (Cumulative Counts & Carry Volumes)
        _propagateBinaryPlacement(parent, position);

        // Process Personal Team Club Progression for parent
        _notifyTeamClubProgression(parent, 0);

        // Check and award Lifetime Milestones for sponsor (in case new direct qualifies sponsor)
        _checkAndAwardLifetimeMilestones(sponsor);

        // Distribute 100% of the $50 registration across 7 streams
        _distributeRegistrationFunds(user, sponsor);

        emit UserRegistered(user, sponsor, parent, position, block.timestamp);
    }

    // --- Placement & Hierarchy Traversal ---

    function _propagateBinaryPlacement(address parent, BinaryPosition position) internal {
        address curr = parent;
        BinaryPosition childPos = position;

        while (curr != address(0)) {
            UserProfile storage node = _users[curr];
            if (childPos == BinaryPosition.Left) {
                node.leftTeamCount++;
                node.leftCarryVolume++;
            } else {
                node.rightTeamCount++;
                node.rightCarryVolume++;
            }

            // Check Binary Matching eligibility and process pairs
            _processBinaryMatching(curr);

            // Check and award Lifetime Milestones instantly upon binary placement
            _checkAndAwardLifetimeMilestones(curr);

            // Traverse upward to next parent
            address nextParent = node.parent;
            if (nextParent != address(0)) {
                childPos = (_users[nextParent].leftChild == curr) ? BinaryPosition.Left : BinaryPosition.Right;
            }
            curr = nextParent;
        }
    }

    function _isUserInSubtree(address target, address rootNode) internal view returns (bool) {
        if (rootNode == address(0)) return false;
        if (target == rootNode) return true;

        address curr = _users[target].parent;
        for (uint256 i = 0; i < 50; i++) {
            if (curr == address(0)) break;
            if (curr == rootNode) return true;
            curr = _users[curr].parent;
        }
        return false;
    }

    function _checkCircularReferral(address user, address sponsor) internal view {
        address curr = sponsor;
        for (uint256 i = 0; i < MAX_UPLINE_LEVELS; i++) {
            if (curr == address(0)) break;
            if (curr == user) revert CircularReferralDetected();
            curr = _users[curr].sponsor;
        }
    }

    // --- 7-Stream Financial Distribution ---

    function _distributeRegistrationFunds(address user, address sponsor) internal {
        // 1. Direct Income: 20% = $10
        uint256 directAmount = DIRECT_INCOME_USD * tokenUnit;
        _creditIncome(sponsor, directAmount, 1);
        emit DirectIncomePaid(sponsor, user, directAmount);

        // 2. Affiliate / Level Income: 14% = $7 (20 levels)
        _distributeAffiliateIncome(user);

        // 3. Club Income: 24% = $12 (Handled via cascading club matrix progression)
        // Kept in contract balance backing rank upgrade liabilities

        // 4. Matching Income Reserve: 20% = $10 (Handled via binary pair matching)
        // Backs $2/pair matching payouts

        // 5. Champion Club Pool: 6% = $3 per registration
        uint256 champAmount = CHAMPION_POOL_USD * tokenUnit;
        championPoolBalance += champAmount;

        // 6. Weekly Reward Pool: 6% = $3
        uint256 weekAmount = WEEKLY_POOL_USD * tokenUnit;
        uint256 currWeek = getCurrentWeeklyEpoch();
        weeklyPoolBalance[currWeek] += weekAmount;

        // 7. Lifetime Reward Reserve: 10% = $5
        // Held in contract balance backing lifetime milestone claims
    }

    function _distributeAffiliateIncome(address user) internal {
        address curr = _users[user].sponsor;
        for (uint8 lvl = 1; lvl <= MAX_UPLINE_LEVELS; lvl++) {
            if (curr == address(0)) {
                // If upline doesn't exist, remaining levels go to Treasury
                uint256 missedAmt = (lvl <= 10) ? (40 * tokenUnit) / 100 : (30 * tokenUnit) / 100;
                _sendMissedToTreasury(address(0), missedAmt, 2, "No upline level");
                continue;
            }

            uint256 levelAmount = (lvl <= 10) ? (40 * tokenUnit) / 100 : (30 * tokenUnit) / 100;
            if (_users[curr].isRegistered) {
                _creditIncome(curr, levelAmount, 2);
                emit AffiliateIncomePaid(curr, user, lvl, levelAmount);
            } else {
                _sendMissedToTreasury(curr, levelAmount, 2, "Upline not active");
            }

            curr = _users[curr].sponsor;
        }
    }

    // --- Binary Matching Calculation ---

    function _processBinaryMatching(address user) internal {
        UserProfile storage u = _users[user];

        // 1:1 Matching
        uint256 availablePairs = u.leftCarryVolume < u.rightCarryVolume ? u.leftCarryVolume : u.rightCarryVolume;
        if (availablePairs == 0) return;

        // Apply Daily Cap (50 pairs/day)
        uint256 currentDay = block.timestamp / SECONDS_PER_DAY;
        uint256 todayMatched = userDailyPairs[user][currentDay];
        if (todayMatched >= MAX_DAILY_PAIRS) return;

        uint256 matchablePairs = availablePairs;
        if (todayMatched + matchablePairs > MAX_DAILY_PAIRS) {
            matchablePairs = MAX_DAILY_PAIRS - todayMatched;
        }

        if (matchablePairs > 0) {
            u.leftCarryVolume -= matchablePairs;
            u.rightCarryVolume -= matchablePairs;
            userDailyPairs[user][currentDay] += matchablePairs;

            uint256 matchAmount = matchablePairs * PAIR_RATE_USD * tokenUnit;

            // Condition: 1 Left direct sponsor and 1 Right direct sponsor
            bool isQualified = (u.leftDirectCount >= 1 && u.rightDirectCount >= 1);

            if (isQualified) {
                _creditIncome(user, matchAmount, 3);
                emit MatchingIncomePaid(user, matchablePairs, matchAmount, u.leftCarryVolume, u.rightCarryVolume);
            } else {
                // Missed Income goes directly to Treasury Wallet
                _sendMissedToTreasury(user, matchAmount, 3, "Missing 1 Left & 1 Right direct");
            }
        }
    }

    // --- Personal Team Club Rank Progression ---

    function _notifyTeamClubProgression(address upline, uint256 rankIndex) internal {
        if (upline == address(0) || rankIndex >= 8) return;

        // Check if user has already completed this rank
        if (userRankCompleted[upline][rankIndex]) return;

        userClubProgress[upline][rankIndex]++;
        ClubRankConfig memory config = clubRanks[rankIndex];

        if (userClubProgress[upline][rankIndex] >= config.requiredMembers) {
            userRankCompleted[upline][rankIndex] = true;
            _users[upline].currentRank = rankIndex + 2; // Advance rank

            // Credit Net Profit instantly to user wallet
            uint256 netProfitAmount = config.netProfit * tokenUnit;
            if (netProfitAmount > 0) {
                _creditIncome(upline, netProfitAmount, 4);
            }

            // Credit Sponsor Commission if applicable
            uint256 sponsorBonus = config.sponsorIncome * tokenUnit;
            address sponsor = _users[upline].sponsor;
            if (sponsorBonus > 0) {
                if (sponsor != address(0) && _users[sponsor].isRegistered) {
                    _creditIncome(sponsor, sponsorBonus, 4);
                } else {
                    _sendMissedToTreasury(sponsor, sponsorBonus, 4, "Club Sponsor not active");
                }
            }

            emit ClubRankAdvanced(
                upline,
                rankIndex + 1,
                netProfitAmount,
                config.upgradeFee * tokenUnit,
                sponsorBonus
            );

            // Promote to next rank: upline's parent receives credit for next rank
            if (rankIndex < 7) {
                address nextUpline = _users[upline].parent;
                _notifyTeamClubProgression(nextUpline, rankIndex + 1);
            }
        }
    }

    // --- Champion Club Monthly Batched Distribution (Admin Driven) ---

    uint256 public constant SECONDS_PER_MONTH = 30 * 86400;
    uint256 public constant MAX_CHAMPION_BATCH_SIZE = 100;

    function getCurrentMonthEpoch() public view returns (uint256) {
        if (systemStartTime == 0 || block.timestamp <= systemStartTime) return 0;
        return (block.timestamp - systemStartTime) / SECONDS_PER_MONTH;
    }

    /**
     * @notice Admin creates snapshot and calculation table of monthly Champion Pool
     */
    function createChampionMonthlySnapshot(uint256 monthEpoch) external onlyOwner {
        if (monthEpoch > getCurrentMonthEpoch()) revert MonthNotClosed();
        ChampionMonthRecord storage record = championMonthlyRecords[monthEpoch];
        if (record.isSnapshotCreated) revert MonthAlreadyDistributed();

        uint256 pool = championPoolBalance;
        if (pool == 0) revert NothingToWithdraw();

        uint256 totalMembers = championMembers.length;
        if (totalMembers == 0) {
            // No qualified members this month: Pool goes directly to Treasury
            championPoolBalance = 0;
            record.totalPool = pool;
            record.totalMembers = 0;
            record.rewardPerMember = 0;
            record.distributedMembersCount = 0;
            record.isSnapshotCreated = true;
            record.isFullyDistributed = true;

            _sendMissedToTreasury(address(0), pool, 5, "No qualified Champion members for month");
            emit ChampionMonthlyPoolSnapshot(monthEpoch, pool, 0, 0);
            return;
        }

        uint256 rewardPerUser = pool / totalMembers;

        record.totalPool = pool;
        record.totalMembers = totalMembers;
        record.rewardPerMember = rewardPerUser;
        record.distributedMembersCount = 0;
        record.isSnapshotCreated = true;
        record.isFullyDistributed = false;

        // Reset the pool accumulator for next month
        championPoolBalance = 0;

        emit ChampionMonthlyPoolSnapshot(monthEpoch, pool, totalMembers, rewardPerUser);
    }

    /**
     * @notice Admin distributes pool to qualified members in safe batches of 50-100 to avoid block gas limits.
     * All rewards are transferred INSTANTLY to qualified members' wallets.
     */
    function distributeChampionBatch(
        uint256 monthEpoch,
        uint256 batchSize
    ) external onlyOwner whenNotPaused nonReentrant {
        if (batchSize == 0 || batchSize > MAX_CHAMPION_BATCH_SIZE) revert BatchSizeExceeded();

        ChampionMonthRecord storage record = championMonthlyRecords[monthEpoch];
        if (!record.isSnapshotCreated) revert NotEligibleForChampion();
        if (record.isFullyDistributed) revert MonthAlreadyDistributed();

        uint256 startIndex = record.distributedMembersCount;
        uint256 totalMembers = record.totalMembers;
        uint256 endIndex = startIndex + batchSize;
        if (endIndex > totalMembers) {
            endIndex = totalMembers;
        }

        uint256 rewardPerMember = record.rewardPerMember;
        uint256 paidCount = 0;
        uint256 totalBatchAmount = 0;

        for (uint256 i = startIndex; i < endIndex; i++) {
            address member = championMembers[i];
            if (!hasReceivedChampionMonth[monthEpoch][member]) {
                hasReceivedChampionMonth[monthEpoch][member] = true;
                paidCount++;
                totalBatchAmount += rewardPerMember;
                _creditIncome(member, rewardPerMember, 5);
            }
        }

        record.distributedMembersCount = endIndex;
        if (endIndex >= totalMembers) {
            record.isFullyDistributed = true;
        }

        emit ChampionBatchDistributed(monthEpoch, startIndex, endIndex, paidCount, totalBatchAmount);
    }

    function getChampionMembersCount() external view returns (uint256) {
        return championMembers.length;
    }

    function getChampionMembers() external view returns (address[] memory) {
        return championMembers;
    }

    // --- Weekly Reward Weekly Batched Distribution (Admin Driven Sunday Morning) ---

    uint256 public constant MAX_WEEKLY_BATCH_SIZE = 100;

    /**
     * @notice Admin creates snapshot and calculation table of concluded Weekly Pool (Sunday Morning)
     */
    function createWeeklyPoolSnapshot(uint256 epoch) external onlyOwner {
        if (epoch > getCurrentWeeklyEpoch()) revert WeekNotClosed();
        WeeklyEpochRecord storage record = weeklyEpochRecords[epoch];
        if (record.isSnapshotCreated) revert WeekAlreadyDistributed();

        uint256 pool = weeklyPoolBalance[epoch];
        if (pool == 0) revert NothingToWithdraw();

        uint256 totalQualifiers = _weeklyQualifiers[epoch].length;
        if (totalQualifiers == 0) {
            // No qualified members this week: Pool goes directly to Treasury
            weeklyPoolBalance[epoch] = 0;
            record.totalPool = pool;
            record.totalQualifiers = 0;
            record.rewardPerQualifier = 0;
            record.distributedMembersCount = 0;
            record.isSnapshotCreated = true;
            record.isFullyDistributed = true;

            _sendMissedToTreasury(address(0), pool, 6, "No qualified Weekly members for week");
            emit WeeklyPoolSnapshot(epoch, pool, 0, 0);
            return;
        }

        uint256 rewardPerUser = pool / totalQualifiers;

        record.totalPool = pool;
        record.totalQualifiers = totalQualifiers;
        record.rewardPerQualifier = rewardPerUser;
        record.distributedMembersCount = 0;
        record.isSnapshotCreated = true;
        record.isFullyDistributed = false;

        weeklyPoolBalance[epoch] = 0;

        emit WeeklyPoolSnapshot(epoch, pool, totalQualifiers, rewardPerUser);
    }

    /**
     * @notice Admin distributes weekly pool to qualified members in safe batches of 50-100.
     * All rewards are transferred INSTANTLY to qualified members' wallets.
     */
    function distributeWeeklyBatch(
        uint256 epoch,
        uint256 batchSize
    ) external onlyOwner whenNotPaused nonReentrant {
        if (batchSize == 0 || batchSize > MAX_WEEKLY_BATCH_SIZE) revert BatchSizeExceeded();

        WeeklyEpochRecord storage record = weeklyEpochRecords[epoch];
        if (!record.isSnapshotCreated) revert NotEligibleForWeekly();
        if (record.isFullyDistributed) revert WeekAlreadyDistributed();

        uint256 startIndex = record.distributedMembersCount;
        uint256 totalQualifiers = record.totalQualifiers;
        uint256 endIndex = startIndex + batchSize;
        if (endIndex > totalQualifiers) {
            endIndex = totalQualifiers;
        }

        uint256 rewardPerQualifier = record.rewardPerQualifier;
        uint256 paidCount = 0;
        uint256 totalBatchAmount = 0;

        for (uint256 i = startIndex; i < endIndex; i++) {
            address member = _weeklyQualifiers[epoch][i];
            if (!hasReceivedWeeklyReward[epoch][member]) {
                hasReceivedWeeklyReward[epoch][member] = true;
                paidCount++;
                totalBatchAmount += rewardPerQualifier;
                _creditIncome(member, rewardPerQualifier, 6);
            }
        }

        record.distributedMembersCount = endIndex;
        if (endIndex >= totalQualifiers) {
            record.isFullyDistributed = true;
        }

        emit WeeklyBatchDistributed(epoch, startIndex, endIndex, paidCount, totalBatchAmount);
    }

    function getWeeklyQualifiersCount(uint256 epoch) external view returns (uint256) {
        return _weeklyQualifiers[epoch].length;
    }

    // --- Lifetime Milestones Claims ---

    /**
     * @notice Get required direct referrals for each milestone tier:
     * Levels 1-5   (index 0-4):   1 direct
     * Levels 6-10  (index 5-9):   2 directs
     * Levels 11-15 (index 10-14): 3 directs
     * Levels 16-20 (index 15-19): 4 directs
     * Levels 21-24 (index 20-23): 5 directs
     * Levels 25-27 (index 24-26): 6 directs
     */
    function getRequiredDirectsForMilestone(uint256 milestoneIndex) public pure returns (uint256) {
        if (milestoneIndex <= 4) return 1;
        if (milestoneIndex <= 9) return 2;
        if (milestoneIndex <= 14) return 3;
        if (milestoneIndex <= 19) return 4;
        if (milestoneIndex <= 23) return 5;
        return 6; // index 24 to 26
    }

    function _checkAndAwardLifetimeMilestones(address user) internal {
        if (!_users[user].isRegistered) return;
        UserProfile storage u = _users[user];

        for (uint256 i = u.completedLifetimeMilestones; i < 27; i++) {
            if (hasClaimedMilestone[user][i]) continue;

            LifetimeMilestone memory milestone = lifetimeMilestones[i];
            if (u.leftTeamCount < milestone.requiredLeft || u.rightTeamCount < milestone.requiredRight) {
                break; // Milestones are strictly sequential and cumulative
            }

            uint256 reqDirects = getRequiredDirectsForMilestone(i);
            if (u.directCount < reqDirects) {
                break; // Milestone waits safely without lapsing for direct referrals
            }

            hasClaimedMilestone[user][i] = true;
            u.completedLifetimeMilestones++;

            uint256 rewardAmount = milestone.rewardAmount * tokenUnit;

            // Milestone 1 ($25):
            // If user has already joined Single Leg manually, user gets $25 instantly.
            // If user has NOT joined Single Leg, $25 is used to auto-activate Single Leg entry.
            if (i == 0) {
                if (_userGlobalClubEntries[user].length == 0) {
                    // Auto-activate Single Leg entry with this $25 (funded internally)
                    _joinGlobalClub(user, false, 0, true);
                } else {
                    _creditIncome(user, rewardAmount, 7);
                }
            } else {
                _creditIncome(user, rewardAmount, 7);
            }

            emit LifetimeRewardClaimed(user, i, rewardAmount);
        }
    }

    /**
     * @notice Automatic instant Lifetime Milestones check & award for any user.
     * Callable by anyone for any user without restrictions.
     */
    function checkAndAwardLifetimeMilestones(address user) external whenNotPaused {
        _checkAndAwardLifetimeMilestones(user);
    }

    /**
     * @notice Backwards-compatible claim function that triggers automatic instant award.
     */
    function claimLifetimeMilestone(uint256 milestoneIndex) external whenNotPaused nonReentrant {
        if (milestoneIndex >= 27) revert InvalidMilestoneIndex();
        _checkAndAwardLifetimeMilestones(msg.sender);
    }

    // --- Single Leg / Global Club ($25 Re-entry Algorithm) ---

    function joinGlobalClub() external whenNotPaused nonReentrant {
        _joinGlobalClub(msg.sender, false, 0, false);
    }

    function joinGlobalClubFor(address user) external whenNotPaused nonReentrant onlyAuthorized {
        if (user == address(0)) revert ZeroAddress();
        _joinGlobalClub(user, false, 0, false);
    }

    function _joinGlobalClub(address user, bool isReentry, uint256 originalEntryId, bool isMilestoneFunded) internal {
        if (!_users[user].isRegistered) revert NotRegistered();

        uint256 cost = GLOBAL_CLUB_USD * tokenUnit;
        if (!isReentry && !isMilestoneFunded) {
            // New paid entry collects $25 USDT
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), cost);
        }

        uint256 newEntryId = globalClubEntries.length;
        globalClubEntries.push(GlobalClubEntryInfo({
            entryId: newEntryId,
            user: user,
            isReentry: isReentry,
            originalEntryId: isReentry ? originalEntryId : newEntryId,
            isCompleted: false,
            cycleTimestamp: 0
        }));

        _userGlobalClubEntries[user].push(newEntryId);

        emit GlobalClubEntered(newEntryId, user, isReentry, isReentry ? originalEntryId : newEntryId);

        // Process Single Leg / Global Club Cycle:
        // Each entry completes when 2 new entries enter after it!
        // Queue Head advances sequentially:
        if (newEntryId >= (globalClubQueueHead * 2) + 2) {
            _completeGlobalClubCycle();
        }
    }

    function _completeGlobalClubCycle() internal {
        uint256 head = globalClubQueueHead;
        if (head >= globalClubEntries.length) return;

        GlobalClubEntryInfo storage completingEntry = globalClubEntries[head];
        if (completingEntry.isCompleted) return;

        completingEntry.isCompleted = true;
        completingEntry.cycleTimestamp = block.timestamp;
        globalClubQueueHead = head + 1;

        address cycleUser = completingEntry.user;
        userGlobalClubTotalCycles[cycleUser]++;

        // Credit $25 Cycle Income directly to wallet
        uint256 cycleIncome = GLOBAL_CLUB_USD * tokenUnit;
        _creditIncome(cycleUser, cycleIncome, 8);

        // Automatically generate re-entry at tail of queue
        uint256 reentryId = globalClubEntries.length;
        _joinGlobalClub(cycleUser, true, completingEntry.originalEntryId, false);

        emit GlobalClubCycleCompleted(completingEntry.entryId, cycleUser, cycleIncome, reentryId);
    }

    // --- Internal Accounting & Instant Wallet Transfers ---

    function _sendMissedToTreasury(address intendedUser, uint256 amount, uint8 category, string memory reason) internal {
        if (amount == 0) return;
        totalIncomeDistributed += amount;
        address destination = treasuryWallet != address(0) ? treasuryWallet : owner();
        IERC20(paymentToken).safeTransfer(destination, amount);
        emit MissedIncomeSentToTreasury(intendedUser, amount, category, reason);
    }

    function _creditIncome(address user, uint256 amount, uint8 category) internal {
        if (user == address(0) || amount == 0) return;

        UserProfile storage u = _users[user];
        IncomeBreakdown storage inc = _incomes[user];

        u.totalIncomeEarned += amount;
        totalIncomeDistributed += amount;

        if (category == 1) inc.directIncome += amount;
        else if (category == 2) inc.affiliateIncome += amount;
        else if (category == 3) inc.matchingIncome += amount;
        else if (category == 4) inc.clubIncome += amount;
        else if (category == 5) inc.championIncome += amount;
        else if (category == 6) inc.weeklyIncome += amount;
        else if (category == 7) inc.lifetimeIncome += amount;
        else if (category == 8) inc.globalClubIncome += amount;

        // Instant direct transfer to user wallet
        IERC20(paymentToken).safeTransfer(user, amount);
    }

    // --- Admin Configuration ---

    function setTreasuryWallet(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryWalletUpdated(treasuryWallet, newTreasury);
        treasuryWallet = newTreasury;
    }

    function setGatewayContract(address gateway) external onlyOwner {
        if (gateway == address(0)) revert ZeroAddress();
        gatewayContract = gateway;
        isAuthorizedGateway[gateway] = true;
    }

    function setAuthorizedGateway(address gateway, bool authorized) external onlyOwner {
        if (gateway == address(0)) revert ZeroAddress();
        isAuthorizedGateway[gateway] = authorized;
    }

    function setLifetimeMilestone(
        uint256 index,
        uint256 requiredLeft,
        uint256 requiredRight,
        uint256 rewardAmount
    ) external onlyOwner {
        if (index >= 27) revert InvalidMilestoneIndex();
        lifetimeMilestones[index] = LifetimeMilestone(requiredLeft, requiredRight, rewardAmount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyRescue(address token, address recipient, uint256 amount) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(recipient, amount);
        emit EmergencyRescued(token, recipient, amount);
    }

    // --- View Functions ---

    function getCurrentWeeklyEpoch() public view returns (uint256) {
        if (systemStartTime == 0 || block.timestamp <= systemStartTime) return 0;
        return (block.timestamp - systemStartTime) / SECONDS_PER_WEEK;
    }

    function setSystemStartTime(uint256 newStartTime) external onlyOwner {
        systemStartTime = newStartTime;
    }

    function getUser(address user) external view returns (UserProfile memory) {
        return _users[user];
    }

    function getIncomeBreakdown(address user) external view returns (IncomeBreakdown memory) {
        return _incomes[user];
    }

    function getDirectReferrals(address user) external view returns (address[] memory) {
        return _directReferrals[user];
    }

    function getWeeklyQualifiers(uint256 epoch) external view returns (address[] memory) {
        return _weeklyQualifiers[epoch];
    }

    function getUserGlobalClubEntries(address user) external view returns (uint256[] memory) {
        return _userGlobalClubEntries[user];
    }

    function getGlobalClubEntry(uint256 entryId) external view returns (GlobalClubEntryInfo memory) {
        return globalClubEntries[entryId];
    }

    function getGlobalClubEntriesCount() external view returns (uint256) {
        return globalClubEntries.length;
    }

    function getUserClubProgress(address user, uint256 rankIndex) external view returns (uint256) {
        if (rankIndex >= 8) return 0;
        return userClubProgress[user][rankIndex];
    }

    function getProtocolStats() external view returns (ProtocolStats memory stats) {
        uint256 bal = IERC20(paymentToken).balanceOf(address(this));
        stats = ProtocolStats({
            elzoraMain: address(this),
            paymentToken: paymentToken,
            treasuryWallet: treasuryWallet,
            rootAddress: rootAddress,
            totalUsers: totalUsers,
            totalRegistrationVolume: totalRegistrationVolume,
            totalIncomeDistributed: totalIncomeDistributed,
            totalLiabilities: totalLiabilities,
            contractTokenBalance: bal,
            globalClubTotalEntries: globalClubEntries.length,
            championPoolBalance: championPoolBalance,
            weeklyPoolBalance: weeklyPoolBalance[getCurrentWeeklyEpoch()],
            currentWeeklyEpoch: getCurrentWeeklyEpoch(),
            currentMonthEpoch: getCurrentMonthEpoch(),
            isPaused: paused()
        });
    }
}
