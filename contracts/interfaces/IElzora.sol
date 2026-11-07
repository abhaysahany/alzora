// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IElzora
 * @notice Interface, data structures, errors, and events for ELZORA smart contracts.
 */
interface IElzora {
    enum BinaryPosition {
        None,
        Left,
        Right
    }

    struct UserProfile {
        address userAddress;
        address sponsor;
        address parent;
        address leftChild;
        address rightChild;
        BinaryPosition position;
        bool isRegistered;
        uint256 directCount;
        uint256 leftDirectCount;
        uint256 rightDirectCount;
        uint256 leftTeamCount;
        uint256 rightTeamCount;
        uint256 leftCarryVolume;
        uint256 rightCarryVolume;
        uint256 currentRank; // 0=None, 1=Starter ... 8=Legend
        uint256 totalIncomeEarned;
        uint256 completedLifetimeMilestones;
    }

    struct IncomeBreakdown {
        uint256 directIncome;
        uint256 affiliateIncome;
        uint256 clubIncome;
        uint256 matchingIncome;
        uint256 championIncome;
        uint256 weeklyIncome;
        uint256 lifetimeIncome;
        uint256 globalClubIncome;
    }

    struct ClubRankConfig {
        string name;
        uint256 requiredMembers;
        uint256 grossIncome;
        uint256 upgradeFee;
        uint256 sponsorIncome;
        uint256 netProfit;
    }

    struct LifetimeMilestone {
        uint256 requiredLeft;
        uint256 requiredRight;
        uint256 rewardAmount;
    }

    struct GlobalClubEntryInfo {
        uint256 entryId;
        address user;
        bool isReentry;
        uint256 originalEntryId;
        bool isCompleted;
        uint256 cycleTimestamp;
    }

    struct ProtocolStats {
        address elzoraMain;
        address paymentToken;
        address treasuryWallet;
        address rootAddress;
        uint256 totalUsers;
        uint256 totalRegistrationVolume;
        uint256 totalIncomeDistributed;
        uint256 totalLiabilities;
        uint256 contractTokenBalance;
        uint256 globalClubTotalEntries;
        uint256 championPoolBalance;
        uint256 weeklyPoolBalance;
        uint256 currentWeeklyEpoch;
        bool isPaused;
    }

    // --- Custom Errors ---
    error ZeroAddress();
    error AlreadyRegistered();
    error NotRegistered();
    error CannotSponsorSelf();
    error SponsorNotActive();
    error ParentNotActive();
    error PositionAlreadyOccupied();
    error InvalidPosition();
    error CircularReferralDetected();
    error InsufficientAllowance();
    error InsufficientBalance();
    error TransferFailed();
    error ContractInsolvent();
    error NothingToWithdraw();
    error FirstPairNotQualified();
    error NoPairsToMatch();
    error DailyMatchingCapExceeded();
    error NotEligibleForChampion();
    error ChampionRewardAlreadyClaimed();
    error NotEligibleForWeekly();
    error WeeklyRewardAlreadyClaimed();
    error LifetimeMilestoneNotReached();
    error LifetimeMilestoneAlreadyClaimed();
    error LifetimeMilestoneDirectsNotMet();
    error InvalidMilestoneIndex();
    error InvalidGlobalClubAmount();
    error Unauthorized();
    error InvalidParameters();
    error BatchSizeExceeded();
    error MonthAlreadyDistributed();
    error NoChampionMembers();
    error MonthNotClosed();
    error WeekNotClosed();
    error WeekAlreadyDistributed();

    // --- Events ---
    event UserRegistered(
        address indexed user,
        address indexed sponsor,
        address indexed parent,
        BinaryPosition position,
        uint256 timestamp
    );

    event DirectIncomePaid(
        address indexed recipient,
        address indexed fromUser,
        uint256 amount
    );

    event AffiliateIncomePaid(
        address indexed recipient,
        address indexed fromUser,
        uint8 level,
        uint256 amount
    );

    event MatchingIncomePaid(
        address indexed recipient,
        uint256 matchedPairs,
        uint256 amount,
        uint256 remainingLeftCarry,
        uint256 remainingRightCarry
    );

    event MissedIncomeSentToTreasury(
        address indexed intendedUser,
        uint256 amount,
        uint8 category,
        string reason
    );

    event ClubRankAdvanced(
        address indexed user,
        uint256 indexed rank,
        uint256 netProfit,
        uint256 upgradeFee,
        uint256 sponsorIncome
    );

    event ChampionClubClaimed(
        address indexed user,
        uint256 amount
    );

    event ChampionMonthlyPoolSnapshot(
        uint256 indexed monthEpoch,
        uint256 totalPool,
        uint256 totalMembers,
        uint256 rewardPerMember
    );

    event ChampionBatchDistributed(
        uint256 indexed monthEpoch,
        uint256 startIndex,
        uint256 endIndex,
        uint256 membersPaid,
        uint256 totalBatchAmount
    );

    event WeeklyRewardClaimed(
        address indexed user,
        uint256 indexed epoch,
        uint256 amount
    );

    event WeeklyPoolSnapshot(
        uint256 indexed weekEpoch,
        uint256 totalPool,
        uint256 totalQualifiers,
        uint256 rewardPerQualifier
    );

    event WeeklyBatchDistributed(
        uint256 indexed weekEpoch,
        uint256 startIndex,
        uint256 endIndex,
        uint256 membersPaid,
        uint256 totalBatchAmount
    );

    event LifetimeRewardClaimed(
        address indexed user,
        uint256 indexed milestoneIndex,
        uint256 amount
    );

    event GlobalClubEntered(
        uint256 indexed entryId,
        address indexed user,
        bool indexed isReentry,
        uint256 originalEntryId
    );

    event GlobalClubCycleCompleted(
        uint256 indexed entryId,
        address indexed user,
        uint256 rewardAmount,
        uint256 newReentryId
    );

    event TreasuryWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event EmergencyRescued(address indexed token, address indexed recipient, uint256 amount);
}

