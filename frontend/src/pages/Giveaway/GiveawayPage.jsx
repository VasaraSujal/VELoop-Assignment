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
import { ErrorState } from '../../components/common/ui/ErrorState.jsx';
import styles from './GiveawayPage.module.css';

export const GiveawayPage = () => {
  const [giveaways, setGiveaways] = useState([]);
  const [featuredGiveaway, setFeaturedGiveaway] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentWinners, setRecentWinners] = useState([]);
  const [previousWinners, setPreviousWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Primary critical request: Fetch current active giveaways
      const allGw = await giveawayService.getCurrentGiveaways();
      const currentList = Array.isArray(allGw) ? allGw : [];
      setGiveaways(currentList);
      
      const featured = currentList.find((g) => g.isFeatured) || currentList[0] || null;
      setFeaturedGiveaway(featured);

      // 2. Supplementary non-blocking requests in parallel (Promise.allSettled guarantees failure in stats/winners does not break page)
      const [statsRes, recentWinsRes, prevWinsRes] = await Promise.allSettled([
        giveawayService.getGiveawayStats(),
        giveawayService.getRecentWinners(),
        giveawayService.getPreviousWinners(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      } else {
        setStats(null);
      }

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

      setLoading(false);
    } catch (err) {
      // If primary giveaway fetch fails after all bounded retries, show error state
      setError(err.message || "We couldn't load giveaways right now. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (error && (!giveaways || giveaways.length === 0)) {
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
      <HeroSection giveaway={featuredGiveaway} isLoading={loading} />

      {/* 2. Platform Statistics */}
      <GiveawayStats stats={stats} isLoading={loading} />

      {/* 3. Active Giveaway / Choose Your Giveaway (Horizontal Premium Carousel) */}
      <GiveawayGrid giveaways={giveaways} isLoading={loading} />

      {/* 4. Giveaway Leaderboard (Top Participants & Prize Draws) */}
      <GiveawayLeaderboard winners={recentWinners} />

      {/* 5. Verified Winner Announcement Slider */}
      <div id="winners" className={styles.winnersAnchor}>
        <WinnerAnnouncement winners={recentWinners} isLoading={loading} />
      </div>

      {/* 5. Winner Rosters & Previous Draws */}
      <WinnerTabs
        recentWinners={recentWinners}
        previousWinners={previousWinners}
        isLoading={loading}
      />

      {/* 6. How to Participate Guide */}
      <HowToParticipate />

      {/* 7. Trust & Security Principles */}
      <TrustSection />

      {/* 8. Rules & Eligibility Guidelines */}
      <RulesSection />

      {/* 9. Interactive FAQ Accordion */}
      <FAQSection />
    </main>
  );
};

export default GiveawayPage;
