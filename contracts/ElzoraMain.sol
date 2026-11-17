// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
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
    Ownable2StepUpgradeable,
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
    uint256 public constant CHAMPION_DIRECTS_REQUIRED = 30; // 30 directs required for Champion Pool (mainnet)
    uint256 public constant WEEKLY_DIRECTS_REQUIRED = 3;   // 3 directs weekly required for Weekly Performance Pool
    uint256 public constant MAX_UPLINE_LEVELS = 20;

    // Time constants
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant SECONDS_PER_WEEK = 7 * 86400;

    bytes32 private constant REASON_NO_UPLINE = "No upline";
    bytes32 private constant REASON_UPLINE_INACTIVE = "Upline inactive";
    bytes32 private constant REASON_MISSING_DIRECTS = "Missing directs";
    bytes32 private constant REASON_SPONSOR_INACTIVE = "Sponsor inactive";
    bytes32 private constant REASON_NO_CHAMPION = "No Champion qualifiers";
    bytes32 private constant REASON_NO_WEEKLY = "No Weekly qualifiers";

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

    // First 3 IDs Exemption Mapping (free from direct conditions & auto-qualified)
    mapping(address => bool) public isExemptFromDirects;

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

    // Global 2xN Auto-Matrix Storage (Model C)
    address[] public globalMatrixUsers; // 1-indexed (index 0 is address(0))
    mapping(address => uint256) public userGlobalMatrixId;

    // Random Member ID Mappings (Option 1: e.g. ELZ12457, stored as 5-digit uint256)
    mapping(uint256 => address) public memberIdToAddress;
    mapping(address => uint256) public addressToMemberId;
    uint256 private _memberIdNonce;

    // Provision for Overpaid Deductions (deducted from future earnings)
    mapping(address => uint256) public pendingIncomeDeduction;

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
        __Ownable2Step_init();
        __Pausable_init();

        paymentToken = initialPaymentToken;
        treasuryWallet = initialTreasury;
        rootAddress = initialRoot;
        systemStartTime = block.timestamp;

        _updateTokenDecimals(initialPaymentToken);
        _initializeRootMember(initialRoot);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Initialization Helpers ---

    function _updateTokenDecimals(address token) internal {
        uint8 dec = IERC20Metadata(token).decimals();
        tokenUnit = 10 ** dec;
    }

    function _initializeRootMember(address root) internal {
        UserProfile storage u = _users[root];
        u.userAddress = root;
        u.sponsor = address(0);
        u.parent = address(0);
        u.isRegistered = true;
        u.currentRank = 1;

        totalUsers = 1;

        // Initialize First 3 IDs exemption for root
        isExemptFromDirects[root] = true;
        isChampionMember[root] = true;
        championMembers.push(root);

        // Initialize Global 2xN Auto-Matrix with root as ID 1
        globalMatrixUsers.push(address(0));
        globalMatrixUsers.push(root);
        userGlobalMatrixId[root] = 1;

        emit UserRegistered(root, address(0), address(0), BinaryPosition.None, block.timestamp);
    }

    // --- External Registration Functions ---

    /**
     * @notice Initializes the Global 2xN Auto-Matrix with existing users.
     * @dev Only callable once by owner. Synchronizes binary tree pointers and level teams.
     */
    function initializeGlobalMatrix(address[] calldata) external pure {
        revert AlreadyInitialized();
    }

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

    function _generateMemberId(address user) internal returns (uint256) {
        _memberIdNonce++;
        uint256 randNum = (uint256(keccak256(abi.encodePacked(block.timestamp, user, _memberIdNonce))) % 90000) + 10000;
        if (memberIdToAddress[randNum] == address(0)) {
            return randNum;
        }
        return 10000 + totalUsers + _memberIdNonce;
    }

    function _register(
        address user,
        address sponsor,
        address parent,
        BinaryPosition position
    ) internal {
        if (user == address(0) || sponsor == address(0)) revert ZeroAddress();
        if (_users[user].isRegistered) revert AlreadyRegistered();
        if (sponsor == user) revert CannotSponsorSelf();
        if (!_users[sponsor].isRegistered) revert SponsorNotActive();

        // 1. Resolve Binary Placement:
        // Respect user's selected position (Left or Right)
        BinaryPosition binaryPos = (position == BinaryPosition.Right) ? BinaryPosition.Right : BinaryPosition.Left;
        address binaryParent = parent;
        if (binaryParent == address(0) || !_users[binaryParent].isRegistered) {
            binaryParent = sponsor;
        }

        // Automatic Extreme Spillover on chosen leg if slot is occupied
        (binaryParent, binaryPos) = findVacantBinaryPlacement(binaryParent, binaryPos);
        if (binaryPos == BinaryPosition.Left) {
            _users[binaryParent].leftChild = user;
        } else {
            _users[binaryParent].rightChild = user;
        }

        // 2. Independent Global 2xN Auto-Matrix Placement (for Affiliate Income & 8 Club Progression)
        uint256 newGlobalId = globalMatrixUsers.length;
        globalMatrixUsers.push(user);
        userGlobalMatrixId[user] = newGlobalId;

        _checkCircularReferral(user, sponsor);

        // Collect $50 USDT registration payment
        uint256 regFee = REGISTRATION_USD * tokenUnit;
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), regFee);

        // Initialize User Profile with Binary Tree hierarchy
        UserProfile storage u = _users[user];
        u.userAddress = user;
        u.sponsor = sponsor;
        u.parent = binaryParent;
        u.position = binaryPos;
        u.isRegistered = true;
        u.currentRank = 1; // Starter

        // Assign random 5-digit Member ID (Option 1: e.g. ELZ12457)
        uint256 mId = _generateMemberId(user);
        memberIdToAddress[mId] = user;
        addressToMemberId[user] = mId;
        emit MemberIdAssigned(user, mId);

        totalUsers++;
        totalRegistrationVolume += regFee;

        // Update Sponsor Stats
        _users[sponsor].directCount++;
        _directReferrals[sponsor].push(user);

        // Check placement relative to sponsor to increment left/right direct counts
        BinaryPosition directSide = _determineDirectSide(user, sponsor);
        if (directSide == BinaryPosition.Left) {
            _users[sponsor].leftDirectCount++;
        } else if (directSide == BinaryPosition.Right) {
            _users[sponsor].rightDirectCount++;
        } else {
            // Direct side matches the chosen binary leg
            if (binaryPos == BinaryPosition.Left) {
                _users[sponsor].leftDirectCount++;
            } else {
                _users[sponsor].rightDirectCount++;
            }
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

        // Check First 3 IDs auto-exemption (ID #2 & ID #3)
        if (totalUsers <= 3) {
            isExemptFromDirects[user] = true;
            if (!isChampionMember[user]) {
                isChampionMember[user] = true;
                championMembers.push(user);
            }
        }

        // Update Binary Tree Placement Hierarchy (Cumulative Counts & Carry Volumes)
        _propagateBinaryPlacement(binaryParent, binaryPos);

        // Process Personal Team Club Progression for personal binary parent (strictly personal team)
        _notifyTeamClubProgression(binaryParent, 0);

        // Check and award Lifetime Milestones for sponsor (in case new direct qualifies sponsor)
        _checkAndAwardLifetimeMilestones(sponsor);

        // Distribute 100% of the $50 registration across 7 streams
        _distributeRegistrationFunds(user, sponsor);

        emit UserRegistered(user, sponsor, binaryParent, binaryPos, block.timestamp);
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

    function _determineDirectSide(address target, address sponsor) internal view returns (BinaryPosition) {
        address curr = target;
        for (uint256 i = 0; i < 150; i++) {
            if (curr == address(0)) break;
            address p = _users[curr].parent;
            if (p == sponsor) {
                return _users[curr].position;
            }
            curr = p;
        }
        return BinaryPosition.None;
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
        uint256 currId = userGlobalMatrixId[user];
        uint256 ancestorId = currId / 2;

        for (uint8 lvl = 1; lvl <= MAX_UPLINE_LEVELS; lvl++) {
            // Levels 1 to 10: $0.40 USDT (40% of $1)
            // Levels 11 to 20: $0.30 USDT (30% of $1)
            uint256 levelAmount = (lvl <= 10) ? (40 * tokenUnit) / 100 : (30 * tokenUnit) / 100;

            if (ancestorId == 0) {
                // If upline doesn't exist in global matrix (above Root ID 1), send to Treasury
                _sendMissedToTreasury(address(0), levelAmount, 2, REASON_NO_UPLINE);
            } else {
                address ancestorAddr = globalMatrixUsers[ancestorId];
                if (_users[ancestorAddr].isRegistered) {
                    _creditIncome(ancestorAddr, levelAmount, 2);
                    emit AffiliateIncomePaid(ancestorAddr, user, lvl, levelAmount);
                } else {
                    _sendMissedToTreasury(ancestorAddr, levelAmount, 2, REASON_UPLINE_INACTIVE);
                }
                ancestorId = ancestorId / 2;
            }
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

            // Condition: 1 Left direct sponsor and 1 Right direct sponsor (Exempt for First 3 IDs)
            bool isQualified = isExemptFromDirects[user] || (u.leftDirectCount >= 1 && u.rightDirectCount >= 1);

            if (isQualified) {
                _creditIncome(user, matchAmount, 3);
                emit MatchingIncomePaid(user, matchablePairs, matchAmount, u.leftCarryVolume, u.rightCarryVolume);
            } else {
                // Missed Income goes directly to Treasury Wallet
                _sendMissedToTreasury(user, matchAmount, 3, REASON_MISSING_DIRECTS);
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
                    _sendMissedToTreasury(sponsor, sponsorBonus, 4, REASON_SPONSOR_INACTIVE);
                }
            }

            emit ClubRankAdvanced(
                upline,
                rankIndex + 1,
                netProfitAmount,
                config.upgradeFee * tokenUnit,
                sponsorBonus
            );

            // Promote to next rank: credit flows to the target level upline ancestor
            if (rankIndex < 7) {
                address nextUpline = _getClubTargetUpline(upline, rankIndex + 1);
                _notifyTeamClubProgression(nextUpline, rankIndex + 1);
            }
        }
    }

    function _getClubTargetUpline(address startUser, uint256 targetRankIndex) internal view returns (address) {
        address curr = startUser;
        uint256 requiredLevels = targetRankIndex + 1;

        for (uint256 i = 0; i < requiredLevels; i++) {
            address p = _users[curr].parent;
            if (p == address(0)) {
                return rootAddress;
            }
            curr = p;
        }

        while (curr != address(0) && userRankCompleted[curr][targetRankIndex]) {
            curr = _users[curr].parent;
        }

        return curr != address(0) ? curr : rootAddress;
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
            record.isSnapshotCreated = true;
            record.isFullyDistributed = true;

            _sendMissedToTreasury(address(0), pool, 5, REASON_NO_CHAMPION);
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

        // Ensure exempt members (First 3 IDs) are automatically included in weekly qualifiers
        _ensureExemptWeeklyQualifiers(epoch);

        uint256 totalQualifiers = _weeklyQualifiers[epoch].length;
        if (totalQualifiers == 0) {
            // No qualified members this week: Pool goes directly to Treasury
            weeklyPoolBalance[epoch] = 0;
            record.totalPool = pool;
            record.isSnapshotCreated = true;
            record.isFullyDistributed = true;

            _sendMissedToTreasury(address(0), pool, 6, REASON_NO_WEEKLY);
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

    function _ensureExemptWeeklyQualifiers(uint256 epoch) internal {
        // Automatically qualify First 3 IDs from Global 2xN Matrix (IDs 1, 2, 3)
        for (uint256 i = 1; i <= 3 && i < globalMatrixUsers.length; i++) {
            address user = globalMatrixUsers[i];
            if (user != address(0) && _users[user].isRegistered && isExemptFromDirects[user]) {
                _addWeeklyQualifierIfNotPresent(epoch, user);
            }
        }
    }

    /**
     * @notice Admin function to manually add a qualified wallet to a weekly epoch if ever needed.
     */
    function addWeeklyQualifier(uint256 epoch, address account) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        _addWeeklyQualifierIfNotPresent(epoch, account);
    }

    function _addWeeklyQualifierIfNotPresent(uint256 epoch, address account) internal {
        if (!isWeeklyQualifier[epoch][account]) {
            isWeeklyQualifier[epoch][account] = true;
            _weeklyQualifiers[epoch].push(account);
        }
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

            LifetimeMilestone storage milestone = lifetimeMilestones[i];
            if (u.leftTeamCount < milestone.requiredLeft || u.rightTeamCount < milestone.requiredRight) {
                break; // Milestones are strictly sequential and cumulative
            }

            uint256 reqDirects = getRequiredDirectsForMilestone(i);
            if (!isExemptFromDirects[user] && u.directCount < reqDirects) {
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
    function claimLifetimeMilestone(uint256) external whenNotPaused {
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

    function _sendMissedToTreasury(address intendedUser, uint256 amount, uint8 category, bytes32 reason) internal {
        if (amount == 0) return;
        totalIncomeDistributed += amount;
        IERC20(paymentToken).safeTransfer(treasuryWallet, amount);
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
        else inc.globalClubIncome += amount;

        // Check for pending income deduction (recovering overpaid amounts)
        uint256 payableAmount = amount;
        uint256 deduction = pendingIncomeDeduction[user];

        if (deduction > 0) {
            if (payableAmount <= deduction) {
                pendingIncomeDeduction[user] -= payableAmount;
                emit IncomeDeducted(user, payableAmount, pendingIncomeDeduction[user], category);
                return; // 100% of this payout is withheld towards the deduction
            } else {
                payableAmount = payableAmount - deduction;
                pendingIncomeDeduction[user] = 0;
                emit IncomeDeducted(user, deduction, 0, category);
            }
        }

        // Instant direct transfer of net payable amount to user wallet
        if (payableAmount > 0) {
            IERC20(paymentToken).safeTransfer(user, payableAmount);
        }
    }

    // --- Admin Reconciliation & Deductions ---

    /**
     * @notice Set pending deduction amount for a user who received extra/overpaid income.
     * Future incomes of this user will be withheld up to this amount.
     */
    function setPendingIncomeDeduction(address user, uint256 amount) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        pendingIncomeDeduction[user] = amount;
        emit PendingDeductionSet(user, amount);
    }

    /**
     * @notice Add to pending deduction amount for a user.
     */
    /**
     * @notice Issue missing/backlog binary matching income for a user who qualified but was underpaid.
     * @param user The member address to credit.
     * @param pairs Number of pairs to pay out ($2 per pair).
     */
    function issueBacklogBinaryIncome(address user, uint256 pairs) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        if (pairs == 0) revert InvalidAmount();
        if (!_users[user].isRegistered) revert UserNotRegistered();

        uint256 matchAmount = pairs * PAIR_RATE_USD * tokenUnit;
        _creditIncome(user, matchAmount, 3);
        emit BacklogBinaryIncomeIssued(user, pairs, matchAmount);
    }

    /**
     * @notice Issue missing/backlog 20-level affiliate income for an upline member.
     * @param user The member address to credit.
     * @param amount The USD amount in tokenUnit (e.g. USDT with 18 decimals).
     */
    function issueBacklogAffiliateIncome(address user, uint256 amount) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (!_users[user].isRegistered) revert UserNotRegistered();

        _creditIncome(user, amount, 2);
        emit BacklogAffiliateIncomeIssued(user, amount);
    }

    /**
     * @notice Issue missing/backlog club net profit income for a member.
     * @param user The member address to credit.
     * @param amount The USD amount in tokenUnit (e.g. USDT with 18 decimals).
     */
    function issueBacklogClubIncome(address user, uint256 amount) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (!_users[user].isRegistered) revert UserNotRegistered();

        _creditIncome(user, amount, 4);
    }

    /**
     * @notice Reconcile club rank progression and completed status for a member.
     */
    function setMemberClubState(
        address user,
        uint256 currentRank,
        uint256 starterProgress,
        bool starterCompleted,
        uint256 leaderProgress,
        bool leaderCompleted
    ) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        if (!_users[user].isRegistered) revert UserNotRegistered();

        if (currentRank > 0) {
            _users[user].currentRank = currentRank;
        }
        userClubProgress[user][0] = starterProgress;
        userRankCompleted[user][0] = starterCompleted;
        userClubProgress[user][1] = leaderProgress;
        userRankCompleted[user][1] = leaderCompleted;
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

    function setLifetimeMilestone(
        uint256 index,
        uint256 requiredLeft,
        uint256 requiredRight,
        uint256 rewardAmount
    ) external onlyOwner {
        if (index >= 27) revert InvalidMilestoneIndex();
        lifetimeMilestones[index] = LifetimeMilestone(requiredLeft, requiredRight, rewardAmount);
    }

    function setClubRank(
        uint256 index,
        string calldata name,
        uint256 requiredMembers,
        uint256 grossIncome,
        uint256 upgradeFee,
        uint256 sponsorIncome,
        uint256 netProfit
    ) external onlyOwner {
        if (index >= 8) revert InvalidParameters();
        clubRanks[index] = ClubRankConfig(name, requiredMembers, grossIncome, upgradeFee, sponsorIncome, netProfit);
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

    /**
     * @notice Admin function to configure or update exempt IDs free from direct conditions.
     */
    function setExemptFromDirects(address account, bool status) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        isExemptFromDirects[account] = status;
        if (status) {
            if (!isChampionMember[account]) {
                isChampionMember[account] = true;
                championMembers.push(account);
            }
        }
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

    function getGlobalMatrixUsersCount() external view returns (uint256) {
        return globalMatrixUsers.length > 0 ? globalMatrixUsers.length - 1 : 0;
    }

    function getNextGlobalMatrixPlacement()
        external
        view
        returns (address parent, BinaryPosition position, uint256 nextId)
    {
        if (globalMatrixUsers.length == 0) return (address(0), BinaryPosition.None, 1);
        nextId = globalMatrixUsers.length;
        uint256 parentId = nextId / 2;
        parent = globalMatrixUsers[parentId];
        position = (nextId % 2 == 0) ? BinaryPosition.Left : BinaryPosition.Right;
    }

    // --- Member ID Queries & Admin Configuration (Option 1) ---

    function getMemberId(address user) external view returns (uint256) {
        return addressToMemberId[user];
    }

    function getAddressByMemberId(uint256 memberId) external view returns (address) {
        return memberIdToAddress[memberId];
    }

    function setMemberId(address user, uint256 memberId) public onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        uint256 oldId = addressToMemberId[user];
        if (oldId > 0) delete memberIdToAddress[oldId];
        if (memberId > 0) {
            memberIdToAddress[memberId] = user;
            addressToMemberId[user] = memberId;
            emit MemberIdAssigned(user, memberId);
        } else {
            delete addressToMemberId[user];
        }
    }

    /**
     * @notice Helper view function to locate next vacant binary placement node and side under a starting node.
     */
    function findVacantBinaryPlacement(
        address startNode,
        BinaryPosition side
    ) public view returns (address parent, BinaryPosition position) {
        if (startNode == address(0) || !_users[startNode].isRegistered) {
            return (rootAddress, BinaryPosition.Left);
        }
        BinaryPosition targetSide = (side == BinaryPosition.Right) ? BinaryPosition.Right : BinaryPosition.Left;
        address curr = startNode;
        if (targetSide == BinaryPosition.Left) {
            while (_users[curr].leftChild != address(0)) {
                curr = _users[curr].leftChild;
            }
            return (curr, BinaryPosition.Left);
        } else {
            while (_users[curr].rightChild != address(0)) {
                curr = _users[curr].rightChild;
            }
            return (curr, BinaryPosition.Right);
        }
    }
}
