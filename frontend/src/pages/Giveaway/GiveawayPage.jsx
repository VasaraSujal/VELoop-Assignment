import { useEffect, useState } from 'react';
import { giveawayService } from '../../services/giveawayService.js';
import HeroSection from '../../components/giveaway/HeroSection.jsx';
import GiveawayStats from '../../components/giveaway/GiveawayStats.jsx';
import GiveawayGrid from '../../components/giveaway/GiveawayGrid.jsx';
import WinnerAnnouncement from '../../components/giveaway/WinnerAnnouncement.jsx';
import WinnerTabs from '../../components/giveaway/WinnerTabs.jsx';
import HowToParticipate from '../../components/giveaway/HowToParticipate.jsx';
import TrustSection from '../../components/giveaway/TrustSection.jsx';
import RulesSection from '../../components/giveaway/RulesSection.jsx';
import FAQSection from '../../components/giveaway/FAQSection.jsx';
import VeloopLoader from '../../components/common/VeloopLoader.jsx';
import styles from './GiveawayPage.module.css';

export const GiveawayPage = () => {
  const [giveaways, setGiveaways] = useState([]);
  const [featuredGiveaway, setFeaturedGiveaway] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentWinners, setRecentWinners] = useState([]);
  const [previousWinners, setPreviousWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      giveawayService.getCurrentGiveaways(),
      giveawayService.getFeaturedGiveaway(),
      giveawayService.getGiveawayStats(),
      giveawayService.getRecentWinners(),
      giveawayService.getPreviousWinners(),
    ])
      .then(([allGw, featuredGw, statsData, recentWins, prevWins]) => {
        setGiveaways(allGw);
        setFeaturedGiveaway(featuredGw || allGw[0] || null);
        setStats(statsData);
        setRecentWinners(recentWins);
        setPreviousWinners(prevWins);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unable to load giveaways right now. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <main className={styles.pageWrapper}>
        <div className={styles.loadingContainer}>
          <VeloopLoader text="Loading live VELOOP Giveaway pools..." />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.pageWrapper}>
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorText}>{error}</p>
            <button type="button" className={styles.retryBtn} onClick={loadData}>
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pageWrapper}>
      {/* 1. Hero / Featured Giveaway Banner (Strategic Dark Navy Section) */}
      <HeroSection giveaway={featuredGiveaway} />

      {/* 2. Platform Statistics */}
      <GiveawayStats stats={stats} />

      {/* 3. Active Giveaway / Prize Cards Grid */}
      <GiveawayGrid giveaways={giveaways} />

      {/* 4. Verified Winner Announcement Slider */}
      <div id="winners" className={styles.winnersAnchor}>
        <WinnerAnnouncement winners={recentWinners} />
      </div>

      {/* 5. Winner Rosters & Previous Draws */}
      <WinnerTabs recentWinners={recentWinners} previousWinners={previousWinners} />

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
