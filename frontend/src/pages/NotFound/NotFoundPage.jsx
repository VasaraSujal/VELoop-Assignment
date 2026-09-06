import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import styles from './NotFoundPage.module.css';

export const NotFoundPage = () => {
  return (
    <main className={styles.page}>
      <div className={styles.code}>404</div>
      <h1 className={styles.title}>Page Not Found</h1>
      <p className={styles.text}>
        The giveaway page or resource you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className={styles.button}>
        <Home size={18} />
        <span>Return to Giveaways</span>
      </Link>
    </main>
  );
};

export default NotFoundPage;
