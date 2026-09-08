import { AuthProvider } from './context/AuthContext.jsx';
import UserBar from './components/common/UserBar.jsx';
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import styles from './styles/App.module.css';

export const App = () => {
  return (
    <AuthProvider>
      <div className={styles.appContainer}>
        <UserBar />
        <Header />
        <div className={styles.mainContent}>
          <AppRoutes />
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
};

export default App;
