import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import styles from './styles/App.module.css';

export const App = () => {
  return (
    <div className={styles.appContainer}>
      <Header />
      <div className={styles.mainContent}>
        <AppRoutes />
      </div>
      <Footer />
    </div>
  );
};

export default App;
