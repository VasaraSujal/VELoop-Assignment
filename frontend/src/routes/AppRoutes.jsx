import { Routes, Route, Navigate } from 'react-router-dom';
import { GiveawayPage } from '../pages/Giveaway/GiveawayPage.jsx';
import { GiveawayDetailsPage } from '../pages/GiveawayDetails/GiveawayDetailsPage.jsx';
import { NotFoundPage } from '../pages/NotFound/NotFoundPage.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<GiveawayPage />} />
      <Route path="/giveaway/:slug" element={<GiveawayDetailsPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRoutes;
