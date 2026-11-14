// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IElzora} from "./interfaces/IElzora.sol";
import {ElzoraMain} from "./ElzoraMain.sol";

/**
 * @title ElzoraGateway
 * @notice DApp Entrypoint, Gateway Router, and Protocol Query Aggregator for ELZORA.
 * @dev Fully independent, decentralized protocol surface on BscScan.
 * Ownerless architecture (owner returns address(0)).
 * Routes registrations and queue entries to ElzoraMain while exposing 40+ rich
 * MLM protocol inspection getters, matrix queries, and aggregated dashboards.
 */
contract ElzoraGateway {
    using SafeERC20 for IERC20;

    // Underlying business engine is private to keep BscScan interface clean and independent
    ElzoraMain private immutable _elzoraMain;
    address public immutable paymentToken;

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

    uint256 public constant PAIR_RATE_USD = 2;          // $2 per matched binary pair
    uint256 public constant MAX_DAILY_PAIRS = 50;       // Daily cap: 50 pairs = $100/day
    uint256 public constant CHAMPION_DIRECTS_REQUIRED = 30; // 30 directs required for Champion Pool
    uint256 public constant WEEKLY_DIRECTS_REQUIRED = 3;   // 3 directs weekly required for Weekly Pool
    uint256 public constant MAX_UPLINE_LEVELS = 20;

    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant SECONDS_PER_WEEK = 604800;
    uint256 public constant WEEK_EPOCH_ANCHOR = 259200;

    // --- Aggregated Frontend Data Structures ---

    struct UserDashboard {
        IElzora.UserProfile profile;
        IElzora.IncomeBreakdown income;
        address[] directReferrals;
        bool isChampionEligible;
        uint256 pendingChampionReward;
        bool isWeeklyEligibleCurrentEpoch;
        uint256 currentWeeklyDirects;
        uint256 currentWeeklyEpoch;
        uint256 todayMatchingPairs;
        uint256[27] milestoneStatus; // 0 = not reached, 1 = claimable, 2 = claimed
        uint256 globalClubEntriesCount;
        uint256 globalClubCyclesCompleted;
    }

    struct BinaryTeamSummary {
        address user;
        address leftChild;
        address rightChild;
        uint256 leftDirects;
        uint256 rightDirects;
        uint256 leftTotalMembers;
        uint256 rightTotalMembers;
        uint256 leftCarryVolume;
        uint256 rightCarryVolume;
        bool isMatchingQualified;
    }

    struct ProtocolOverview {
        address elzoraMainAddress;
        address gatewayAddress;
        address paymentToken;
        address treasuryWallet;
        address rootAddress;
        uint256 totalUsers;
        uint256 totalRegistrationVolume;
        uint256 totalIncomeDistributed;
        uint256 totalLiabilities;
        uint256 contractTokenBalance;
        bool isSolvent;
        uint256 championPoolBalance;
        uint256 weeklyPoolBalance;
        uint256 currentWeeklyEpoch;
        uint256 currentMonthEpoch;
        uint256 globalClubTotalEntries;
        bool isPaused;
    }

    constructor(address elzoraMainAddress) {
        if (elzoraMainAddress == address(0)) revert IElzora.ZeroAddress();
        _elzoraMain = ElzoraMain(elzoraMainAddress);
        paymentToken = _elzoraMain.paymentToken();
    }

    // --- Decentralized Ownership ---

    /**
     * @notice Gateway is a trustless, immutable router contract.
     * @dev Returns address(0) to signal fully decentralized, ownerless status.
     */
    function owner() external pure returns (address) {
        return address(0);
    }

    function pendingOwner() external pure returns (address) {
        return address(0);
    }

    // --- Write Router Functions ---

    /**
     * @notice Register a new member through the Gateway.
     * @dev User approves USDT spending to ElzoraGateway or ElzoraMain.
     */
    function register(
        address sponsor,
        address parent,
        IElzora.BinaryPosition position
    ) external {
        uint256 regFee = _elzoraMain.REGISTRATION_USD() * _elzoraMain.tokenUnit();
        uint256 allowanceToGateway = IERC20(paymentToken).allowance(msg.sender, address(this));

        if (allowanceToGateway >= regFee) {
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), regFee);
            IERC20(paymentToken).safeIncreaseAllowance(address(_elzoraMain), regFee);
        }

        _elzoraMain.registerFor(msg.sender, sponsor, parent, position);
    }

    /**
     * @notice Join Global Club ($25 Re-entry Queue).
     */
    function joinGlobalClub() external {
        uint256 fee = _elzoraMain.GLOBAL_CLUB_USD() * _elzoraMain.tokenUnit();
        uint256 allowanceToGateway = IERC20(paymentToken).allowance(msg.sender, address(this));

        if (allowanceToGateway >= fee) {
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), fee);
            IERC20(paymentToken).safeIncreaseAllowance(address(_elzoraMain), fee);
        }

        _elzoraMain.joinGlobalClubFor(msg.sender);
    }

    /**
     * @notice Automatic instant Lifetime Milestone check & award.
     */
    function checkAndAwardLifetimeMilestones(address user) external {
        _elzoraMain.checkAndAwardLifetimeMilestones(user);
    }

    /**
     * @notice Backwards-compatible claim function that triggers automatic instant award.
     */
    function claimLifetimeMilestone(uint256 /* milestoneIndex */) external {
        _elzoraMain.checkAndAwardLifetimeMilestones(msg.sender);
    }

    // --- Query & View Aggregator Functions ---

    /**
     * @notice Complete dashboard aggregation for a single user in one RPC call.
     */
    function getUserDashboard(address user) external view returns (UserDashboard memory dash) {
        IElzora.UserProfile memory prof = _elzoraMain.getUser(user);
        IElzora.IncomeBreakdown memory inc = _elzoraMain.getIncomeBreakdown(user);
        address[] memory directs = _elzoraMain.getDirectReferrals(user);

        uint256 currEpoch = _elzoraMain.getCurrentWeeklyEpoch();
        uint256 weeklyCount = _elzoraMain.weeklyDirectCount(currEpoch, user);
        bool champEligible = _elzoraMain.isChampionMember(user);
        bool isExempt = _elzoraMain.isExemptFromDirects(user);

        uint256 pendingChamp = 0;
        uint256 currMonth = _elzoraMain.getCurrentMonthEpoch();
        (,, uint256 rPerMemberCurr,, bool isSnapCurr, bool isFullyCurr) = _elzoraMain.championMonthlyRecords(currMonth);
        if (isSnapCurr && !isFullyCurr && champEligible && !_elzoraMain.hasReceivedChampionMonth(currMonth, user)) {
            pendingChamp = rPerMemberCurr;
        } else if (currMonth > 0) {
            uint256 prevMonth = currMonth - 1;
            (,, uint256 rPerMember,, bool isSnap, bool isFully) = _elzoraMain.championMonthlyRecords(prevMonth);
            if (isSnap && !isFully && champEligible && !_elzoraMain.hasReceivedChampionMonth(prevMonth, user)) {
                pendingChamp = rPerMember;
            }
        }

        uint256 today = block.timestamp / 86400;
        uint256 todayPairs = _elzoraMain.userDailyPairs(user, today);

        uint256[27] memory milestones;
        for (uint256 i = 0; i < 27; i++) {
            if (_elzoraMain.hasClaimedMilestone(user, i)) {
                milestones[i] = 2; // Claimed
            } else {
                (uint256 reqL, uint256 reqR, ) = _elzoraMain.lifetimeMilestones(i);
                uint256 reqDirects = _elzoraMain.getRequiredDirectsForMilestone(i);
                if (prof.leftTeamCount >= reqL && prof.rightTeamCount >= reqR && (isExempt || prof.directCount >= reqDirects)) {
                    milestones[i] = 1; // Claimable
                } else {
                    milestones[i] = 0; // Not reached
                }
            }
        }

        uint256[] memory gcEntries = _elzoraMain.getUserGlobalClubEntries(user);

        dash = UserDashboard({
            profile: prof,
            income: inc,
            directReferrals: directs,
            isChampionEligible: champEligible || isExempt,
            pendingChampionReward: pendingChamp,
            isWeeklyEligibleCurrentEpoch: isExempt || weeklyCount >= 3,
            currentWeeklyDirects: weeklyCount,
            currentWeeklyEpoch: currEpoch,
            todayMatchingPairs: todayPairs,
            milestoneStatus: milestones,
            globalClubEntriesCount: gcEntries.length,
            globalClubCyclesCompleted: _elzoraMain.userGlobalClubTotalCycles(user)
        });
    }

    /**
     * @notice Get Binary team statistics for tree visualizer.
     */
    function getBinaryTeamSummary(address user) external view returns (BinaryTeamSummary memory summary) {
        IElzora.UserProfile memory prof = _elzoraMain.getUser(user);
        summary = BinaryTeamSummary({
            user: user,
            leftChild: prof.leftChild,
            rightChild: prof.rightChild,
            leftDirects: prof.leftDirectCount,
            rightDirects: prof.rightDirectCount,
            leftTotalMembers: prof.leftTeamCount,
            rightTotalMembers: prof.rightTeamCount,
            leftCarryVolume: prof.leftCarryVolume,
            rightCarryVolume: prof.rightCarryVolume,
            isMatchingQualified: _elzoraMain.isExemptFromDirects(user) || (prof.leftDirectCount >= 1 && prof.rightDirectCount >= 1)
        });
    }

    /**
     * @notice Protocol-wide status and solvency overview.
     */
    function getProtocolOverview() external view returns (ProtocolOverview memory overview) {
        IElzora.ProtocolStats memory stats = _elzoraMain.getProtocolStats();
        overview = ProtocolOverview({
            elzoraMainAddress: address(this), // Clean gateway self-reference
            gatewayAddress: address(this),
            paymentToken: paymentToken,
            treasuryWallet: stats.treasuryWallet,
            rootAddress: stats.rootAddress,
            totalUsers: stats.totalUsers,
            totalRegistrationVolume: stats.totalRegistrationVolume,
            totalIncomeDistributed: stats.totalIncomeDistributed,
            totalLiabilities: stats.totalLiabilities,
            contractTokenBalance: stats.contractTokenBalance,
            isSolvent: stats.contractTokenBalance >= stats.totalLiabilities,
            championPoolBalance: stats.championPoolBalance,
            weeklyPoolBalance: stats.weeklyPoolBalance,
            currentWeeklyEpoch: stats.currentWeeklyEpoch,
            currentMonthEpoch: stats.currentMonthEpoch,
            globalClubTotalEntries: stats.globalClubTotalEntries,
            isPaused: stats.isPaused
        });
    }

    /**
     * @notice Batch fetch user dashboards.
     */
    function getMultipleUserDashboards(address[] calldata users) external view returns (UserDashboard[] memory dashboards) {
        dashboards = new UserDashboard[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            dashboards[i] = this.getUserDashboard(users[i]);
        }
    }

    /**
     * @notice Fetches paginated Global Club entries for a user.
     */
    function getUserGlobalClubHistory(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (IElzora.GlobalClubEntryInfo[] memory entries, uint256 total) {
        uint256[] memory allIds = _elzoraMain.getUserGlobalClubEntries(user);
        total = allIds.length;

        if (offset >= total) {
            return (new IElzora.GlobalClubEntryInfo[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 count = end - offset;
        entries = new IElzora.GlobalClubEntryInfo[](count);

        for (uint256 i = 0; i < count; i++) {
            entries[i] = _elzoraMain.getGlobalClubEntry(allIds[offset + i]);
        }
    }

    // --- Standalone Rich Protocol Getters & Passthroughs ---

    // 1. Protocol Solvency & Core Metrics
    function totalUsers() external view returns (uint256) {
        return _elzoraMain.totalUsers();
    }

    function totalRegistrationVolume() external view returns (uint256) {
        return _elzoraMain.totalRegistrationVolume();
    }

    function totalIncomeDistributed() external view returns (uint256) {
        return _elzoraMain.totalIncomeDistributed();
    }

    function totalLiabilities() external view returns (uint256) {
        return _elzoraMain.totalLiabilities();
    }

    function tokenUnit() external view returns (uint256) {
        return _elzoraMain.tokenUnit();
    }

    function systemStartTime() external view returns (uint256) {
        return _elzoraMain.systemStartTime();
    }

    function contractTokenBalance() external view returns (uint256) {
        return IERC20(paymentToken).balanceOf(address(_elzoraMain));
    }

    function isSolvent() external view returns (bool) {
        return IERC20(paymentToken).balanceOf(address(_elzoraMain)) >= _elzoraMain.totalLiabilities();
    }

    function isPaused() external view returns (bool) {
        return _elzoraMain.paused();
    }

    function treasuryWallet() external view returns (address) {
        return _elzoraMain.treasuryWallet();
    }

    function rootAddress() external view returns (address) {
        return _elzoraMain.rootAddress();
    }

    function getProtocolStats() external view returns (IElzora.ProtocolStats memory) {
        return _elzoraMain.getProtocolStats();
    }

    // 2. User & Binary Profile Queries
    function getUser(address user) external view returns (IElzora.UserProfile memory) {
        return _elzoraMain.getUser(user);
    }

    function getIncomeBreakdown(address user) external view returns (IElzora.IncomeBreakdown memory) {
        return _elzoraMain.getIncomeBreakdown(user);
    }

    function getDirectReferrals(address user) external view returns (address[] memory) {
        return _elzoraMain.getDirectReferrals(user);
    }

    function userDailyPairs(address user, uint256 day) external view returns (uint256) {
        return _elzoraMain.userDailyPairs(user, day);
    }

    function isExemptFromDirects(address user) external view returns (bool) {
        return _elzoraMain.isExemptFromDirects(user);
    }

    // 3. Global 2xN Auto-Matrix (Model C)
    function globalMatrixUsers(uint256 id) external view returns (address) {
        return _elzoraMain.globalMatrixUsers(id);
    }

    function userGlobalMatrixId(address user) external view returns (uint256) {
        return _elzoraMain.userGlobalMatrixId(user);
    }

    function getGlobalMatrixUsersCount() external view returns (uint256) {
        return _elzoraMain.getGlobalMatrixUsersCount();
    }

    function getNextGlobalMatrixPlacement() external view returns (address parent, IElzora.BinaryPosition position, uint256 nextId) {
        return _elzoraMain.getNextGlobalMatrixPlacement();
    }

    // 4. Club Ranks (Starter to Legend)
    function clubRanks(uint256 index) external view returns (
        string memory name,
        uint256 requiredMembers,
        uint256 grossIncome,
        uint256 upgradeFee,
        uint256 sponsorIncome,
        uint256 netProfit
    ) {
        return _elzoraMain.clubRanks(index);
    }

    function userClubProgress(address user, uint256 rankIndex) external view returns (uint256) {
        return _elzoraMain.userClubProgress(user, rankIndex);
    }

    function userRankCompleted(address user, uint256 rankIndex) external view returns (bool) {
        return _elzoraMain.userRankCompleted(user, rankIndex);
    }

    // 5. Lifetime Milestones (27 Tiers)
    function lifetimeMilestones(uint256 index) external view returns (
        uint256 requiredLeft,
        uint256 requiredRight,
        uint256 rewardAmount
    ) {
        return _elzoraMain.lifetimeMilestones(index);
    }

    function hasClaimedMilestone(address user, uint256 index) external view returns (bool) {
        return _elzoraMain.hasClaimedMilestone(user, index);
    }

    function getRequiredDirectsForMilestone(uint256 milestoneIndex) external view returns (uint256) {
        return _elzoraMain.getRequiredDirectsForMilestone(milestoneIndex);
    }

    // 6. Single-Leg Global Club ($25 Re-entry Queue)
    function globalClubEntries(uint256 index) external view returns (
        uint256 entryId,
        address user,
        bool isReentry,
        uint256 originalEntryId,
        bool isCompleted,
        uint256 cycleTimestamp
    ) {
        return _elzoraMain.globalClubEntries(index);
    }

    function globalClubQueueHead() external view returns (uint256) {
        return _elzoraMain.globalClubQueueHead();
    }

    function getGlobalClubEntriesCount() external view returns (uint256) {
        return _elzoraMain.getGlobalClubEntriesCount();
    }

    function getUserGlobalClubEntries(address user) external view returns (uint256[] memory) {
        return _elzoraMain.getUserGlobalClubEntries(user);
    }

    function getGlobalClubEntry(uint256 entryId) external view returns (IElzora.GlobalClubEntryInfo memory) {
        return _elzoraMain.getGlobalClubEntry(entryId);
    }

    function userGlobalClubTotalCycles(address user) external view returns (uint256) {
        return _elzoraMain.userGlobalClubTotalCycles(user);
    }

    // 7. Champion Club & Weekly Pools
    function championPoolBalance() external view returns (uint256) {
        return _elzoraMain.championPoolBalance();
    }

    function isChampionMember(address user) external view returns (bool) {
        return _elzoraMain.isChampionMember(user);
    }

    function getChampionMembersCount() external view returns (uint256) {
        return _elzoraMain.getChampionMembersCount();
    }

    function getChampionMembers() external view returns (address[] memory) {
        return _elzoraMain.getChampionMembers();
    }

    function weeklyPoolBalance(uint256 epoch) external view returns (uint256) {
        return _elzoraMain.weeklyPoolBalance(epoch);
    }

    function weeklyDirectCount(uint256 epoch, address user) external view returns (uint256) {
        return _elzoraMain.weeklyDirectCount(epoch, user);
    }

    function getWeeklyQualifiers(uint256 epoch) external view returns (address[] memory) {
        return _elzoraMain.getWeeklyQualifiers(epoch);
    }

    function getWeeklyQualifiersCount(uint256 epoch) external view returns (uint256) {
        return _elzoraMain.getWeeklyQualifiersCount(epoch);
    }

    function isWeeklyQualifier(uint256 epoch, address user) external view returns (bool) {
        return _elzoraMain.isWeeklyQualifier(epoch, user);
    }

    function getCurrentWeeklyEpoch() external view returns (uint256) {
        return _elzoraMain.getCurrentWeeklyEpoch();
    }

    function getCurrentMonthEpoch() external view returns (uint256) {
        return _elzoraMain.getCurrentMonthEpoch();
    }
}
