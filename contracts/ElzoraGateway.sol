// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IElzora} from "./interfaces/IElzora.sol";
import {ElzoraMain} from "./ElzoraMain.sol";

/**
 * @title ElzoraGateway
 * @notice DApp Entrypoint, Gateway Router, and Query Aggregator for ELZORA.
 * @dev Routes write transactions to ElzoraMain, aggregates high-efficiency batch views,
 * and maintains frontend ABI compatibility without duplicating core financial logic.
 */
contract ElzoraGateway {
    using SafeERC20 for IERC20;

    ElzoraMain public immutable elzoraMain;
    address public immutable paymentToken;

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
        elzoraMain = ElzoraMain(elzoraMainAddress);
        paymentToken = elzoraMain.paymentToken();
    }

    // --- Write Router Functions ---

    /**
     * @notice Register a new member through the Gateway.
     * @dev User must approve USDT spending directly to ElzoraMain or ElzoraGateway.
     */
    function register(
        address sponsor,
        address parent,
        IElzora.BinaryPosition position
    ) external {
        // If user approved Gateway, forward token to ElzoraMain
        uint256 regFee = elzoraMain.REGISTRATION_USD() * elzoraMain.tokenUnit();
        uint256 allowanceToGateway = IERC20(paymentToken).allowance(msg.sender, address(this));

        if (allowanceToGateway >= regFee) {
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), regFee);
            IERC20(paymentToken).safeIncreaseAllowance(address(elzoraMain), regFee);
        }

        elzoraMain.registerFor(msg.sender, sponsor, parent, position);
    }

    /**
     * @notice Join Global Club ($25 Re-entry Queue).
     */
    function joinGlobalClub() external {
        uint256 fee = elzoraMain.GLOBAL_CLUB_USD() * elzoraMain.tokenUnit();
        uint256 allowanceToGateway = IERC20(paymentToken).allowance(msg.sender, address(this));

        if (allowanceToGateway >= fee) {
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), fee);
            IERC20(paymentToken).safeIncreaseAllowance(address(elzoraMain), fee);
        }

        elzoraMain.joinGlobalClubFor(msg.sender);
    }

    /**
     * @notice Automatic instant Lifetime Milestone check & award.
     */
    function checkAndAwardLifetimeMilestones(address user) external {
        elzoraMain.checkAndAwardLifetimeMilestones(user);
    }

    /**
     * @notice Backwards-compatible claim function that triggers automatic instant award.
     */
    function claimLifetimeMilestone(uint256 /* milestoneIndex */) external {
        elzoraMain.checkAndAwardLifetimeMilestones(msg.sender);
    }

    // --- Query & View Aggregator Functions ---

    /**
     * @notice Complete dashboard aggregation for a single user in one RPC call.
     */
    function getUserDashboard(address user) external view returns (UserDashboard memory dash) {
        IElzora.UserProfile memory prof = elzoraMain.getUser(user);
        IElzora.IncomeBreakdown memory inc = elzoraMain.getIncomeBreakdown(user);
        address[] memory directs = elzoraMain.getDirectReferrals(user);

        uint256 currEpoch = elzoraMain.getCurrentWeeklyEpoch();
        uint256 weeklyCount = elzoraMain.weeklyDirectCount(currEpoch, user);
        bool champEligible = elzoraMain.isChampionMember(user);
        bool isExempt = elzoraMain.isExemptFromDirects(user);

        uint256 pendingChamp = 0;
        uint256 currMonth = elzoraMain.getCurrentMonthEpoch();
        (,, uint256 rPerMemberCurr,, bool isSnapCurr, bool isFullyCurr) = elzoraMain.championMonthlyRecords(currMonth);
        if (isSnapCurr && !isFullyCurr && champEligible && !elzoraMain.hasReceivedChampionMonth(currMonth, user)) {
            pendingChamp = rPerMemberCurr;
        } else if (currMonth > 0) {
            uint256 prevMonth = currMonth - 1;
            (,, uint256 rPerMember,, bool isSnap, bool isFully) = elzoraMain.championMonthlyRecords(prevMonth);
            if (isSnap && !isFully && champEligible && !elzoraMain.hasReceivedChampionMonth(prevMonth, user)) {
                pendingChamp = rPerMember;
            }
        }

        uint256 today = block.timestamp / 86400;
        uint256 todayPairs = elzoraMain.userDailyPairs(user, today);

        uint256[27] memory milestones;
        for (uint256 i = 0; i < 27; i++) {
            if (elzoraMain.hasClaimedMilestone(user, i)) {
                milestones[i] = 2; // Claimed
            } else {
                (uint256 reqL, uint256 reqR, ) = elzoraMain.lifetimeMilestones(i);
                uint256 reqDirects = elzoraMain.getRequiredDirectsForMilestone(i);
                if (prof.leftTeamCount >= reqL && prof.rightTeamCount >= reqR && (isExempt || prof.directCount >= reqDirects)) {
                    milestones[i] = 1; // Claimable
                } else {
                    milestones[i] = 0; // Not reached
                }
            }
        }

        uint256[] memory gcEntries = elzoraMain.getUserGlobalClubEntries(user);

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
            globalClubCyclesCompleted: elzoraMain.userGlobalClubTotalCycles(user)
        });
    }

    /**
     * @notice Get Binary team statistics for tree visualizer.
     */
    function getBinaryTeamSummary(address user) external view returns (BinaryTeamSummary memory summary) {
        IElzora.UserProfile memory prof = elzoraMain.getUser(user);
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
            isMatchingQualified: elzoraMain.isExemptFromDirects(user) || (prof.leftDirectCount >= 1 && prof.rightDirectCount >= 1)
        });
    }

    /**
     * @notice Protocol-wide status and solvency overview.
     */
    function getProtocolOverview() external view returns (ProtocolOverview memory overview) {
        IElzora.ProtocolStats memory stats = elzoraMain.getProtocolStats();
        overview = ProtocolOverview({
            elzoraMainAddress: address(elzoraMain),
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

    function getCurrentMonthEpoch() external view returns (uint256) {
        return elzoraMain.getCurrentMonthEpoch();
    }

    function getCurrentWeeklyEpoch() external view returns (uint256) {
        return elzoraMain.getCurrentWeeklyEpoch();
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
        uint256[] memory allIds = elzoraMain.getUserGlobalClubEntries(user);
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
            entries[i] = elzoraMain.getGlobalClubEntry(allIds[offset + i]);
        }
    }

    // --- Pass-Through Getters ---

    function getUser(address user) external view returns (IElzora.UserProfile memory) {
        return elzoraMain.getUser(user);
    }

    function getIncomeBreakdown(address user) external view returns (IElzora.IncomeBreakdown memory) {
        return elzoraMain.getIncomeBreakdown(user);
    }

    function getDirectReferrals(address user) external view returns (address[] memory) {
        return elzoraMain.getDirectReferrals(user);
    }

    function getWeeklyQualifiers(uint256 epoch) external view returns (address[] memory) {
        return elzoraMain.getWeeklyQualifiers(epoch);
    }

    function rootAddress() external view returns (address) {
        return elzoraMain.rootAddress();
    }

    function owner() external view returns (address) {
        return elzoraMain.owner();
    }

    function pendingOwner() external view returns (address) {
        return elzoraMain.pendingOwner();
    }
}

