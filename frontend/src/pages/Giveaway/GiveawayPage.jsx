import { useEffect, useState } from 'react';
import { giveawayService } from '../../services/giveawayService.js';
import HeroSection from '../../components/giveaway/HeroSection.jsx';
import GiveawayStats from '../../components/giveaway/GiveawayStats.jsx';
import GiveawayGrid from '../../components/giveaway/GiveawayGrid.jsx';
import GiveawayLeaderboard from '../../components/giveaway/GiveawayLeaderboard.jsx';
import WinnerAnnouncement from '../../components/giveaway/WinnerAnnouncement.jsx';
import WinnerTabs from '../../components/giveaway/WinnerTabs.jsx';
import HowToParticipate from '../../components/giveaway/HowToParticipate.jsx';
import TrustSection from '../../components/giveaway/TrustSection.jsx';
import RulesSection from '../../components/giveaway/RulesSection.jsx';
import FAQSection from '../../components/giveaway/FAQSection.jsx';
import FinalCTA from '../../components/giveaway/FinalCTA.jsx';
import { ErrorState } from '../../components/common/ui/ErrorState.jsx';
import styles from './GiveawayPage.module.css';

export const GiveawayPage = () => {
  const [giveaways, setGiveaways] = useState([]);
  const [featuredGiveaway, setFeaturedGiveaway] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentWinners, setRecentWinners] = useState([]);
  const [previousWinners, setPreviousWinners] = useState([]);

  // Granular independent loading states to prevent secondary requests from blocking primary giveaway UI
  const [isGiveawaysLoading, setIsGiveawaysLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isWinnersLoading, setIsWinnersLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    setIsGiveawaysLoading(true);
    setIsStatsLoading(true);
    setIsWinnersLoading(true);
    setError(null);

    // 1. Primary critical request: Fetch current active giveaways
    // Dispatched immediately; unblocks primary giveaway hero and grid as soon as response arrives
    giveawayService
      .getCurrentGiveaways()
      .then((allGw) => {
        const currentList = Array.isArray(allGw) ? allGw : [];
        setGiveaways(currentList);

        const featured = currentList.find((g) => g.isFeatured) || currentList[0] || null;
        setFeaturedGiveaway(featured);
        setIsGiveawaysLoading(false);
      })
      .catch((err) => {
        setError(err.message || "We couldn't load giveaways right now. Please try again.");
        setIsGiveawaysLoading(false);
      });

    // 2. Secondary independent request: Platform statistics
    // Dispatched concurrently; resolves independently without blocking primary content
    giveawayService
      .getGiveawayStats()
      .then((data) => {
        setStats(data || null);
      })
      .catch(() => {
        setStats(null);
      })
      .finally(() => {
        setIsStatsLoading(false);
      });

    // 3. Secondary independent requests: Recent & Previous Winners
    // Dispatched concurrently; resolves independently without blocking primary content
    Promise.allSettled([
      giveawayService.getRecentWinners(),
      giveawayService.getPreviousWinners(),
    ])
      .then(([recentWinsRes, prevWinsRes]) => {
        if (recentWinsRes.status === 'fulfilled' && Array.isArray(recentWinsRes.value)) {
          setRecentWinners(recentWinsRes.value);
        } else {
          setRecentWinners([]);
        }

        if (prevWinsRes.status === 'fulfilled' && Array.isArray(prevWinsRes.value)) {
          setPreviousWinners(prevWinsRes.value);
        } else {
          setPreviousWinners([]);
        }
      })
      .finally(() => {
        setIsWinnersLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (error && (!giveaways || giveaways.length === 0) && !isGiveawaysLoading) {
    return (
      <main className={styles.pageWrapper}>
        <div className={styles.errorContainer}>
          <ErrorState
            title="We couldn't load giveaways right now"
            message={error || 'Please check your connection and try again.'}
            onRetry={loadData}
            retryLabel="Try Again"
          />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pageWrapper}>
      {/* 1. Hero / Featured Giveaway Banner (Strategic Dark Navy Section) */}
      <HeroSection giveaway={featuredGiveaway} isLoading={isGiveawaysLoading} />

      {/* 2. Platform Statistics */}
      <GiveawayStats stats={stats} isLoading={isStatsLoading} />

      {/* 3. Active Giveaway / Choose Your Giveaway (Horizontal Premium Carousel) */}
      <GiveawayGrid giveaways={giveaways} isLoading={isGiveawaysLoading} />

      {/* 4. Giveaway Leaderboard (Top Participants & Prize Draws) */}
      <GiveawayLeaderboard winners={recentWinners} isLoading={isWinnersLoading} />

      {/* 5. Verified Winner Announcement Slider */}
      <div id="winners" className={styles.winnersAnchor}>
        <WinnerAnnouncement winners={recentWinners} isLoading={isWinnersLoading} />
      </div>

      {/* 5. Winner Rosters & Previous Draws */}
      <WinnerTabs
        recentWinners={recentWinners}
        previousWinners={previousWinners}
        isLoading={isWinnersLoading}
      />

      {/* 6. How to Participate Guide */}
      <HowToParticipate />

      {/* 7. Trust & Security Principles */}
      <TrustSection />

      {/* 8. Rules & Eligibility Guidelines */}
      <RulesSection />

      {/* 9. Interactive FAQ Accordion */}
      <FAQSection />

      {/* 10. Pre-Footer High-Impact CTA */}
      <FinalCTA />
    </main>
  );
};

export default GiveawayPage;

